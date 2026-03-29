"""
Scrapes PlayerOverview*.asp?PlayerId=X (Test / ODI / T20I) to populate `career_stats`.

URL suffixes:
  Test  → PlayerOverview.asp
  ODI   → PlayerOverview_ODI.asp
  T20I  → PlayerOverview_T20.asp
"""
import re
from datetime import datetime, timezone
from bs4 import BeautifulSoup

from app.scraper.client import fetch_page
from app.database import supabase

FORMAT_PATHS = {
    "test": "PlayerOverview.asp",
    "odi": "PlayerOverview_ODI.asp",
    "t20i": "PlayerOverview_T20.asp",
}


def _clean(val: str | None) -> str | None:
    if not val:
        return None
    val = val.strip()
    return None if val in ("-", "", "–", "N/A") else val


def _to_int(val: str | None) -> int | None:
    c = _clean(val)
    if c is None:
        return None
    try:
        return int(c.replace(",", ""))
    except ValueError:
        return None


def _to_float(val: str | None) -> float | None:
    c = _clean(val)
    if c is None:
        return None
    try:
        return float(c.replace(",", ""))
    except ValueError:
        return None


def _parse_career_table(soup: BeautifulSoup, section_title: str) -> list[str]:
    """
    Locate a table near a heading that matches section_title and return
    the first data row as a list of cell strings.
    """
    for heading in soup.find_all(["h2", "h3", "b", "td"], string=re.compile(section_title, re.IGNORECASE)):
        table = heading.find_next("table")
        if table:
            rows = table.find_all("tr")
            for row in rows[1:]:  # skip header row
                cells = [td.get_text(strip=True) for td in row.find_all("td")]
                if cells:
                    return cells
    return []


def _parse_overview_page(html: str) -> dict:
    """Parse a PlayerOverview page and return a career_stats dict (no player_id/format yet)."""
    soup = BeautifulSoup(html, "lxml")
    data: dict = {}

    # All stats tables on the page — typical layout:
    # 1st table = batting summary, 2nd = bowling summary, 3rd = fielding, 4th = captaincy
    tables = soup.find_all("table", class_=re.compile(r"TableLined|Data", re.IGNORECASE))
    if not tables:
        # Fall back: any table with more than 5 columns
        tables = [t for t in soup.find_all("table") if len(t.find_all("td")) > 10]

    def _rows(table) -> list[list[str]]:
        return [
            [td.get_text(strip=True) for td in row.find_all("td")]
            for row in table.find_all("tr")
            if row.find_all("td")
        ]

    # We look for tables by their header keywords
    for table in tables:
        headers = [th.get_text(strip=True).lower() for th in table.find_all("th")]
        if not headers:
            # Some tables use the first row as header
            first_row = table.find("tr")
            if first_row:
                headers = [td.get_text(strip=True).lower() for td in first_row.find_all("td")]

        rows = _rows(table)
        if not rows:
            continue

        # Batting table: has "innings" or "runs" header
        if any(h in ("inn", "innings", "runs", "ave", "avg") for h in headers):
            if "wickets" not in " ".join(headers) and "wkts" not in " ".join(headers):
                # batting
                for row in rows:
                    if len(row) >= 6:
                        data.update(_map_batting(headers, row))
                        break

        # Bowling table: has "wickets" or "wkts"
        if any(h in ("wkts", "wickets") for h in headers):
            for row in rows:
                if len(row) >= 5:
                    data.update(_map_bowling(headers, row))
                    break

        # Fielding
        if any(h in ("catches", "catch", "ct") for h in headers):
            for row in rows:
                if len(row) >= 2:
                    data.update(_map_fielding(headers, row))
                    break

        # Captaincy
        if any(h in ("won", "lost", "drawn", "tied") for h in headers):
            for row in rows:
                if len(row) >= 3:
                    data.update(_map_captaincy(headers, row))
                    break

    return data


def _idx(headers: list[str], *names: str) -> int | None:
    for name in names:
        for i, h in enumerate(headers):
            if name in h:
                return i
    return None


def _map_batting(headers: list[str], row: list[str]) -> dict:
    def g(*names):
        i = _idx(headers, *names)
        return row[i] if i is not None and i < len(row) else None

    return {
        "bat_matches": _to_int(g("mat", "m")),
        "bat_innings": _to_int(g("inn", "inns")),
        "bat_not_outs": _to_int(g("no", "not out")),
        "bat_runs": _to_int(g("runs")),
        "bat_highest": _clean(g("hs", "best", "highest")),
        "bat_average": _to_float(g("ave", "avg")),
        "bat_strike_rate": _to_float(g("sr", "s/r", "strike")),
        "bat_hundreds": _to_int(g("100")),
        "bat_fifties": _to_int(g("50")),
        "bat_ducks": _to_int(g("0", "duck")),
        "bat_fours": _to_int(g("4s", "fours")),
        "bat_sixes": _to_int(g("6s", "sixes")),
    }


def _map_bowling(headers: list[str], row: list[str]) -> dict:
    def g(*names):
        i = _idx(headers, *names)
        return row[i] if i is not None and i < len(row) else None

    return {
        "bowl_matches": _to_int(g("mat", "m")),
        "bowl_innings": _to_int(g("inn", "inns")),
        "bowl_balls": _to_int(g("ball", "b")),
        "bowl_maidens": _to_int(g("maiden", "m")),
        "bowl_runs": _to_int(g("runs")),
        "bowl_wickets": _to_int(g("wkt", "wkts", "wickets")),
        "bowl_average": _to_float(g("ave", "avg")),
        "bowl_economy": _to_float(g("econ", "eco")),
        "bowl_strike_rate": _to_float(g("sr", "s/r")),
        "bowl_best_innings": _clean(g("best", "bbi", "bi")),
        "bowl_five_wickets": _to_int(g("5i", "5w", "5-wkt")),
        "bowl_ten_wickets": _to_int(g("10i", "10w", "10m")),
    }


def _map_fielding(headers: list[str], row: list[str]) -> dict:
    def g(*names):
        i = _idx(headers, *names)
        return row[i] if i is not None and i < len(row) else None

    return {
        "field_catches": _to_int(g("catch", "ct")),
        "field_stumpings": _to_int(g("stump", "st")),
    }


def _map_captaincy(headers: list[str], row: list[str]) -> dict:
    def g(*names):
        i = _idx(headers, *names)
        return row[i] if i is not None and i < len(row) else None

    return {
        "capt_matches": _to_int(g("mat", "m")),
        "capt_wins": _to_int(g("won", "win", "w")),
        "capt_losses": _to_int(g("lost", "loss", "l")),
        "capt_draws": _to_int(g("draw", "d", "tied")),
    }


async def scrape_overview(player_db_id: str, howstat_id: int) -> None:
    """
    Scrape all 3 format overview pages for a player and upsert into `career_stats`.
    player_db_id: UUID primary key from the `players` table.
    """
    now = datetime.now(timezone.utc).isoformat()

    for fmt, path in FORMAT_PATHS.items():
        try:
            html = await fetch_page(f"{path}?PlayerId={howstat_id}")
            stats = _parse_overview_page(html)
            stats["player_id"] = player_db_id
            stats["format"] = fmt
            stats["scraped_at"] = now
            # Remove None values to avoid overwriting valid data with null
            stats = {k: v for k, v in stats.items() if v is not None}
            supabase.table("career_stats").upsert(
                stats, on_conflict="player_id,format"
            ).execute()
        except Exception as exc:
            # Log but don't abort — other formats may still work
            print(f"[overview] Failed {fmt} for player {howstat_id}: {exc}")
