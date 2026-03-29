from fastapi import APIRouter, BackgroundTasks, HTTPException
from pydantic import BaseModel

from app.scraper.orchestrator import run_player_pipeline
from app.scraper.player_list import scrape_player_list, COUNTRY_NAMES
from app.database import supabase

router = APIRouter()


class ScrapeResponse(BaseModel):
    status: str
    player_id: str | None = None
    howstat_id: int | None = None
    errors: list[str] = []
    reason: str | None = None


@router.post("/{howstat_id}/scrape", response_model=ScrapeResponse)
async def trigger_scrape(howstat_id: int, background_tasks: BackgroundTasks):
    """
    Trigger scrape for a player if data is missing or stale (>24 h old).
    Runs in the background and returns immediately with the player's DB UUID.
    """
    # Quick lookup to return player_id immediately if already in DB
    result = (
        supabase.table("players")
        .select("id")
        .eq("howstat_id", howstat_id)
        .maybe_single()
        .execute()
    )
    player_id = result.data["id"] if result.data else None

    background_tasks.add_task(run_player_pipeline, howstat_id, force=False)

    return ScrapeResponse(
        status="accepted",
        player_id=player_id,
        howstat_id=howstat_id,
    )


@router.post("/{howstat_id}/refresh", response_model=ScrapeResponse)
async def force_refresh(howstat_id: int, background_tasks: BackgroundTasks):
    """Force re-scrape regardless of TTL."""
    result = (
        supabase.table("players")
        .select("id")
        .eq("howstat_id", howstat_id)
        .maybe_single()
        .execute()
    )
    player_id = result.data["id"] if result.data else None

    background_tasks.add_task(run_player_pipeline, howstat_id, force=True)

    return ScrapeResponse(
        status="accepted",
        player_id=player_id,
        howstat_id=howstat_id,
    )


@router.post("/discover/{country_code}")
async def discover_players(country_code: str, background_tasks: BackgroundTasks):
    """Scrape player list for a country (background task)."""
    country_code = country_code.upper()
    if country_code not in COUNTRY_NAMES:
        raise HTTPException(
            status_code=400,
            detail=f"Unknown country code. Valid codes: {list(COUNTRY_NAMES.keys())}",
        )
    background_tasks.add_task(scrape_player_list, country_code)
    return {"status": "accepted", "country_code": country_code}
