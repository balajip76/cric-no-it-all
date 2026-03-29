"""
Full per-player scraping pipeline.
Runs all scrapers in a logical order and returns a status summary.
"""
import asyncio
from datetime import datetime, timezone

from app.database import supabase
from app.scraper.player_summary import scrape_player_summary
from app.scraper.overview import scrape_overview
from app.scraper.progress_batting import scrape_progress_batting
from app.scraper.progress_bowling import scrape_progress_bowling
from app.scraper.analysis_year import scrape_analysis_year
from app.scraper.analysis_opponent import scrape_analysis_opponent
from app.scraper.analysis_ground import scrape_analysis_ground
from app.scraper.analysis_homeaway import scrape_analysis_homeaway
from app.scraper.analysis_dismissals import scrape_analysis_dismissals


async def _get_or_create_player(howstat_id: int) -> dict:
    """
    Look up player by howstat_id. If not found, create a placeholder row.
    Returns the player row dict (must include 'id' UUID and 'howstat_id').
    """
    result = (
        supabase.table("players")
        .select("*")
        .eq("howstat_id", howstat_id)
        .maybe_single()
        .execute()
    )
    if result.data:
        return result.data

    # Create placeholder so FK constraints on career_stats etc. are satisfied
    insert_result = (
        supabase.table("players")
        .insert({
            "howstat_id": howstat_id,
            "full_name": f"Player #{howstat_id}",
            "display_name": f"Player #{howstat_id}",
            "updated_at": datetime.now(timezone.utc).isoformat(),
        })
        .execute()
    )
    return insert_result.data[0]


async def run_player_pipeline(howstat_id: int, force: bool = False) -> dict:
    """
    Orchestrate the full scrape pipeline for a player.
    - force=False: respects TTL (checks scraped_at on career_stats)
    - force=True: skips TTL check, always re-scrapes

    Returns {"status": "ok"|"skipped"|"error", "player_id": uuid, ...}
    """
    player = await _get_or_create_player(howstat_id)
    player_db_id = player["id"]

    if not force:
        # Check if career_stats are fresh (within 24 hours)
        existing = (
            supabase.table("career_stats")
            .select("scraped_at")
            .eq("player_id", player_db_id)
            .limit(1)
            .execute()
        )
        if existing.data:
            from datetime import timedelta
            scraped_at_str = existing.data[0].get("scraped_at")
            if scraped_at_str:
                scraped_at = datetime.fromisoformat(scraped_at_str.replace("Z", "+00:00"))
                age_hours = (datetime.now(timezone.utc) - scraped_at).total_seconds() / 3600
                if age_hours < 24:
                    return {"status": "skipped", "reason": "fresh_cache", "player_id": player_db_id}

    errors = []

    # Phase 1: profile (fast, single page)
    try:
        await scrape_player_summary(howstat_id)
        # Re-fetch player to get updated name/country
        player = await _get_or_create_player(howstat_id)
        player_db_id = player["id"]
    except Exception as exc:
        errors.append(f"player_summary: {exc}")

    # Phase 2: career overview (3 pages, one per format)
    try:
        await scrape_overview(player_db_id, howstat_id)
    except Exception as exc:
        errors.append(f"overview: {exc}")

    # Phase 3: innings logs (6 pages — batting + bowling × 3 formats) run concurrently
    await asyncio.gather(
        scrape_progress_batting(player_db_id, howstat_id),
        scrape_progress_bowling(player_db_id, howstat_id),
        return_exceptions=True,
    )

    # Phase 4: analysis tables (5 types × 3 formats = 15 pages) run concurrently
    await asyncio.gather(
        scrape_analysis_year(player_db_id, howstat_id),
        scrape_analysis_opponent(player_db_id, howstat_id),
        scrape_analysis_ground(player_db_id, howstat_id),
        scrape_analysis_homeaway(player_db_id, howstat_id),
        scrape_analysis_dismissals(player_db_id, howstat_id),
        return_exceptions=True,
    )

    # Update last_viewed_at
    supabase.table("players").update(
        {"last_viewed_at": datetime.now(timezone.utc).isoformat()}
    ).eq("id", player_db_id).execute()

    return {
        "status": "ok" if not errors else "partial",
        "player_id": player_db_id,
        "howstat_id": howstat_id,
        "errors": errors,
    }
