"""
Scrapes PlayerProgressBowl*.asp to build innings-by-innings bowling log.
Writes to `innings_bowling` table.
"""
import re
from datetime import datetime, timezone
from bs4 import BeautifulSoup

from app.scraper.client import fetch_page
from app.database import supabase

FORMAT_PATHS = {
    "test": "PlayerProgressBowl.asp",
    "odi": "PlayerProgressBowl_ODI.asp",
    "t20i": "PlayerProgressBowl_T20.asp",
}


def _clean(v: str | None) -> str | None:
    if not v:
        return None
    v = v.strip()
    return None if v in ("-", "", "–", "DNB") else v


def _to_int(v: str | None) -> int | None:
    c = _clean(v)
    if c is None:
        return None
    try:
        return int(re.sub(r"[^\d]", "", c))
    except ValueError:
        return None


def _to_float(v: str | None) -> float | None:
    c = _clean(v)
    if c is None:
        return None
    try:
        return float(c)
    except ValueError:
        return None


def _parse_date(raw: str) -> str | None:
    from datetime import datetime
    for fmt in ("%d %b %Y", "%d/%m/%Y", "%Y-%m-%d"):
        try:
            return datetime.strptime(raw.strip(), fmt).date().isoformat()
        except ValueError:
            pass
    return None


async def scrape_progress_bowling(player_db_id: str, howstat_id: int) -> None:
    now = datetime.now(timezone.utc).isoformat()

    for fmt, path in FORMAT_PATHS.items():
        try:
            html = await fetch_page(f"{path}?PlayerID={howstat_id}")
            soup = BeautifulSoup(html, "lxml")

            rows = []
            match_num = 0

            for table in soup.find_all("table"):
                headers = [th.get_text(strip=True).lower() for th in table.find_all("th")]
                if not headers:
                    continue
                if not any(h in ("wickets", "wkts", "wkt", "w") for h in headers):
                    continue

                for tr in table.find_all("tr")[1:]:
                    cells = [td.get_text(strip=True) for td in tr.find_all("td")]
                    if len(cells) < 4:
                        continue

                    match_num += 1

                    def g(col_name, *alt):
                        for name in (col_name,) + alt:
                            for i, h in enumerate(headers):
                                if name in h and i < len(cells):
                                    return cells[i]
                        return None

                    row = {
                        "player_id": player_db_id,
                        "format": fmt,
                        "match_number": match_num,
                        "innings_number": _to_int(g("inn", "inns")) or 1,
                        "match_date": _parse_date(g("date") or ""),
                        "opponent": _clean(g("opponent", "opp", "opposition")),
                        "ground": _clean(g("ground", "venue")),
                        "overs": _to_float(g("overs", "ov", "o")),
                        "maidens": _to_int(g("maiden", "m")),
                        "runs_conceded": _to_int(g("runs", "r")),
                        "wickets": _to_int(g("wickets", "wkts", "wkt", "w")),
                        "economy": _to_float(g("econ", "eco", "er")),
                        "scraped_at": now,
                    }
                    rows.append({k: v for k, v in row.items() if v is not None})

            if rows:
                supabase.table("innings_bowling").upsert(
                    rows, on_conflict="player_id,format,match_number,innings_number"
                ).execute()

        except Exception as exc:
            print(f"[progress_bowling] Failed {fmt} for player {howstat_id}: {exc}")
