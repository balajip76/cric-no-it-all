"""Scrapes PlayerHomeAway*.asp → stats_home_away table."""
from datetime import datetime, timezone
from bs4 import BeautifulSoup

from app.scraper.client import fetch_page
from app.database import supabase
from app.scraper.overview import _to_int, _to_float, _clean

FORMAT_PATHS = {
    "test": "PlayerHomeAway.asp",
    "odi": "PlayerHomeAway_ODI.asp",
    "t20i": "PlayerHomeAway_T20.asp",
}


async def scrape_analysis_homeaway(player_db_id: str, howstat_id: int) -> None:
    now = datetime.now(timezone.utc).isoformat()

    for fmt, path in FORMAT_PATHS.items():
        try:
            html = await fetch_page(f"{path}?PlayerID={howstat_id}")
            soup = BeautifulSoup(html, "lxml")

            for table in soup.find_all("table"):
                headers = [th.get_text(strip=True).lower() for th in table.find_all("th")]
                if not headers:
                    continue
                if not any(h in ("home", "away", "neutral", "venue type") for h in headers):
                    # Check first column values
                    first_cells = [
                        tr.find("td").get_text(strip=True).lower()
                        for tr in table.find_all("tr")[1:]
                        if tr.find("td")
                    ]
                    if not any(v in first_cells for v in ("home", "away", "neutral")):
                        continue

                rows = []
                for tr in table.find_all("tr")[1:]:
                    cells = [td.get_text(strip=True) for td in tr.find_all("td")]
                    if len(cells) < 3:
                        continue

                    venue_type = _clean(cells[0])
                    if not venue_type or venue_type.lower() not in ("home", "away", "neutral"):
                        continue

                    def g(*names):
                        for name in names:
                            for i, h in enumerate(headers):
                                if name in h and i < len(cells):
                                    return cells[i]
                        return None

                    rows.append({
                        "player_id": player_db_id,
                        "format": fmt,
                        "venue_type": venue_type.lower(),
                        "bat_matches": _to_int(g("mat", "m")),
                        "bat_innings": _to_int(g("inn", "inns")),
                        "bat_runs": _to_int(g("runs")),
                        "bat_not_outs": _to_int(g("no")),
                        "bat_average": _to_float(g("ave", "avg")),
                        "bat_strike_rate": _to_float(g("s/r", "sr")),
                        "bat_highest": _clean(g("hs", "best")),
                        "bat_hundreds": _to_int(g("100")),
                        "bat_fifties": _to_int(g("50")),
                        "bowl_wickets": _to_int(g("wkt", "wkts")),
                        "scraped_at": now,
                    })

                clean_rows = [{k: v for k, v in r.items() if v is not None} for r in rows]
                if clean_rows:
                    supabase.table("stats_home_away").upsert(
                        clean_rows, on_conflict="player_id,format,venue_type"
                    ).execute()
                break

        except Exception as exc:
            print(f"[analysis_homeaway] Failed {fmt} for player {howstat_id}: {exc}")
