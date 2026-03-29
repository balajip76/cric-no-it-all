"""
Scrapes PlayerList.asp?Country=XXX to discover players for a given country.
Writes discovered players to the `players` table via supabase-py.
"""
import re
from bs4 import BeautifulSoup
from datetime import datetime, timezone

from app.scraper.client import fetch_page
from app.database import supabase

# Maps country code → full name
COUNTRY_NAMES = {
    "AFG": "Afghanistan",
    "AUS": "Australia",
    "BAN": "Bangladesh",
    "ENG": "England",
    "IND": "India",
    "IRE": "Ireland",
    "NZ": "New Zealand",
    "PAK": "Pakistan",
    "SA": "South Africa",
    "SL": "Sri Lanka",
    "WI": "West Indies",
    "ZIM": "Zimbabwe",
    "NAM": "Namibia",
    "NEP": "Nepal",
    "OMA": "Oman",
    "PNG": "Papua New Guinea",
    "SCO": "Scotland",
    "UAE": "United Arab Emirates",
    "USA": "United States",
    "NED": "Netherlands",
}


async def scrape_player_list(country_code: str) -> list[dict]:
    """
    Scrape player list for a country and upsert into Supabase.
    Returns list of player dicts that were upserted.
    """
    html = await fetch_page(f"PlayerList.asp?Country={country_code}")
    soup = BeautifulSoup(html, "lxml")

    players: list[dict] = []

    # Rows contain player links like: PlayerOverview.asp?PlayerID=3600
    for link in soup.find_all("a", href=re.compile(r"PlayerOverview\.asp\?PlayerID=(\d+)")):
        match = re.search(r"PlayerID=(\d+)", link["href"])
        if not match:
            continue
        howstat_id = int(match.group(1))
        full_name = link.get_text(strip=True)
        if not full_name:
            continue

        players.append(
            {
                "howstat_id": howstat_id,
                "full_name": full_name,
                "display_name": full_name,
                "country": COUNTRY_NAMES.get(country_code, country_code),
                "updated_at": datetime.now(timezone.utc).isoformat(),
            }
        )

    if players:
        supabase.table("players").upsert(players, on_conflict="howstat_id").execute()

    return players
