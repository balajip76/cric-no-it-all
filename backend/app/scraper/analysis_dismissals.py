"""Scrapes PlayerDismissBat*.asp → dismissal_stats table."""
from datetime import datetime, timezone
from bs4 import BeautifulSoup

from app.scraper.client import fetch_page
from app.database import supabase
from app.scraper.overview import _to_int, _clean

FORMAT_PATHS = {
    "test": "PlayerDismissBat.asp",
    "odi": "PlayerDismissBat_ODI.asp",
    "t20i": "PlayerDismissBat_T20.asp",
}


async def scrape_analysis_dismissals(player_db_id: str, howstat_id: int) -> None:
    now = datetime.now(timezone.utc).isoformat()

    for fmt, path in FORMAT_PATHS.items():
        try:
            html = await fetch_page(f"{path}?PlayerID={howstat_id}")
            soup = BeautifulSoup(html, "lxml")

            for table in soup.find_all("table"):
                headers = [th.get_text(strip=True).lower() for th in table.find_all("th")]
                if not headers:
                    continue
                if not any(h in ("bowler", "caught", "bowled", "lbw") for h in headers):
                    continue

                rows = []
                for tr in table.find_all("tr")[1:]:
                    cells = [td.get_text(strip=True) for td in tr.find_all("td")]
                    if len(cells) < 3:
                        continue

                    def g(*names):
                        for name in names:
                            for i, h in enumerate(headers):
                                if name in h and i < len(cells):
                                    return cells[i]
                        return None

                    bowler_name = _clean(g("bowler", "name"))
                    if not bowler_name:
                        continue

                    rows.append({
                        "player_id": player_db_id,
                        "format": fmt,
                        "bowler_name": bowler_name,
                        "bowler_country": _clean(g("country")),
                        "dismissed_bowled": _to_int(g("bowled", "b")),
                        "dismissed_caught": _to_int(g("caught", "c")),
                        "dismissed_caught_bowled": _to_int(g("c&b", "caught & bowled")),
                        "dismissed_lbw": _to_int(g("lbw")),
                        "dismissed_stumped": _to_int(g("stumped", "st")),
                        "dismissed_run_out": _to_int(g("run out", "ro")),
                        "dismissed_total": _to_int(g("total", "tot")),
                        "scraped_at": now,
                    })

                clean_rows = [{k: v for k, v in r.items() if v is not None} for r in rows]
                if clean_rows:
                    supabase.table("dismissal_stats").upsert(
                        clean_rows, on_conflict="player_id,format,bowler_name"
                    ).execute()
                break

        except Exception as exc:
            print(f"[analysis_dismissals] Failed {fmt} for player {howstat_id}: {exc}")
