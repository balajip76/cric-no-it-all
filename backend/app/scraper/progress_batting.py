"""
Scrapes PlayerProgressBat*.asp to build innings-by-innings batting log.
Writes to `innings_batting` table.
"""
import re
from datetime import datetime, timezone
from bs4 import BeautifulSoup

from app.scraper.client import fetch_page
from app.database import supabase

FORMAT_PATHS = {
    "test": "PlayerProgressBat.asp",
    "odi": "PlayerProgressBat_ODI.asp",
    "t20i": "PlayerProgressBat_T20.asp",
}


def _clean(v: str | None) -> str | None:
    if not v:
        return None
    v = v.strip()
    return None if v in ("-", "", "–", "DNB", "TDNB", "sub") else v


def _to_int(v: str | None) -> int | None:
    c = _clean(v)
    if c is None:
        return None
    c = re.sub(r"[*+†]", "", c)  # remove not-out markers
    try:
        return int(c)
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
    for fmt in ("%d %b %Y", "%d/%m/%Y", "%Y-%m-%d", "%b %Y"):
        try:
            return datetime.strptime(raw.strip(), fmt).date().isoformat()
        except ValueError:
            pass
    return None


def _is_not_out(runs_str: str | None) -> bool:
    if runs_str and ("*" in runs_str or "†" in runs_str):
        return True
    return False


async def scrape_progress_batting(player_db_id: str, howstat_id: int) -> None:
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
                # We need at least: date, opponent, ground, runs
                if not any(h in ("runs", "r") for h in headers):
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

                    runs_raw = g("runs", "r")
                    row = {
                        "player_id": player_db_id,
                        "format": fmt,
                        "match_number": match_num,
                        "innings_number": _to_int(g("inn", "inns")) or 1,
                        "match_date": _parse_date(g("date") or ""),
                        "opponent": _clean(g("opponent", "opp", "opposition")),
                        "ground": _clean(g("ground", "venue")),
                        "runs": _to_int(runs_raw),
                        "balls_faced": _to_int(g("balls", "bf", "b")),
                        "strike_rate": _to_float(g("s/r", "sr", "strike")),
                        "dismissal_type": _clean(g("dismissal", "how out", "how")),
                        "not_out": _is_not_out(runs_raw),
                        "scraped_at": now,
                    }
                    rows.append({k: v for k, v in row.items() if v is not None})

            if rows:
                supabase.table("innings_batting").upsert(
                    rows, on_conflict="player_id,format,match_number,innings_number"
                ).execute()

        except Exception as exc:
            print(f"[progress_batting] Failed {fmt} for player {howstat_id}: {exc}")
