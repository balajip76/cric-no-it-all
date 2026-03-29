"""
Scrapes PlayerOverviewSummary.asp?PlayerID=X to get biographical data:
date_of_birth, batting_style, bowling_style, full_name, country.
Updates the `players` table.
"""
import re
from datetime import datetime, timezone
from bs4 import BeautifulSoup

from app.scraper.client import fetch_page
from app.database import supabase


def _extract_text(soup: BeautifulSoup, label: str) -> str | None:
    """Find a table cell containing `label` and return the adjacent value cell."""
    td = soup.find("td", string=re.compile(label, re.IGNORECASE))
    if td:
        sibling = td.find_next_sibling("td")
        if sibling:
            return sibling.get_text(strip=True) or None
    return None


async def scrape_player_summary(howstat_id: int) -> dict:
    """
    Fetch player biography from howstat and upsert into `players`.
    Returns the dict that was upserted.
    """
    html = await fetch_page(f"PlayerOverviewSummary.asp?PlayerID={howstat_id}")
    soup = BeautifulSoup(html, "lxml")

    full_name = _extract_text(soup, "Full Name")
    country = _extract_text(soup, "Country")
    dob_raw = _extract_text(soup, "Date of Birth")
    batting_style = _extract_text(soup, "Batting Style")
    bowling_style = _extract_text(soup, "Bowling Style")

    # Parse DOB if present
    dob = None
    if dob_raw:
        for fmt in ("%d %B %Y", "%B %d, %Y", "%d/%m/%Y"):
            try:
                dob = datetime.strptime(dob_raw.split("(")[0].strip(), fmt).date().isoformat()
                break
            except ValueError:
                pass

    payload: dict = {
        "howstat_id": howstat_id,
        "profile_scraped_at": datetime.now(timezone.utc).isoformat(),
        "updated_at": datetime.now(timezone.utc).isoformat(),
    }
    if full_name:
        payload["full_name"] = full_name
        payload["display_name"] = full_name
    if country:
        payload["country"] = country
    if dob:
        payload["date_of_birth"] = dob
    if batting_style:
        payload["batting_style"] = batting_style
    if bowling_style:
        payload["bowling_style"] = bowling_style

    supabase.table("players").upsert(payload, on_conflict="howstat_id").execute()
    return payload
