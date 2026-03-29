"""
APScheduler jobs:
- Daily at 02:00 UTC: re-scrape active players (career_stats older than 24 h)
- Weekly on Monday at 03:00 UTC: discover new players for all countries
"""
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.cron import CronTrigger

from app.database import supabase
from app.scraper.orchestrator import run_player_pipeline
from app.scraper.player_list import scrape_player_list, COUNTRY_NAMES

scheduler = AsyncIOScheduler(timezone="UTC")


async def _daily_refresh():
    """Re-scrape players whose career_stats are older than 24 hours."""
    from datetime import datetime, timezone, timedelta

    cutoff = (datetime.now(timezone.utc) - timedelta(hours=24)).isoformat()

    # Find players whose most recent career_stats.scraped_at is stale
    stale = (
        supabase.table("career_stats")
        .select("player_id, players(howstat_id)")
        .lt("scraped_at", cutoff)
        .limit(50)
        .execute()
        .data
    )

    for row in stale:
        player_data = row.get("players")
        if player_data and isinstance(player_data, dict):
            howstat_id = player_data.get("howstat_id")
            if howstat_id:
                try:
                    await run_player_pipeline(howstat_id, force=False)
                except Exception as exc:
                    print(f"[scheduler] daily_refresh failed for {howstat_id}: {exc}")


async def _weekly_discovery():
    """Discover new players for all countries."""
    for code in COUNTRY_NAMES:
        try:
            await scrape_player_list(code)
        except Exception as exc:
            print(f"[scheduler] discovery failed for {code}: {exc}")


def start_scheduler():
    scheduler.add_job(_daily_refresh, CronTrigger(hour=2, minute=0), id="daily_refresh")
    scheduler.add_job(
        _weekly_discovery, CronTrigger(day_of_week="mon", hour=3, minute=0), id="weekly_discovery"
    )
    scheduler.start()
    return scheduler
