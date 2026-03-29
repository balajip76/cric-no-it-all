"""
Builds system prompt from player stats stored in Supabase,
then streams a Claude response as SSE.
"""
import asyncio
import json
from datetime import datetime, timezone
from typing import AsyncIterator

import anthropic

from app.config import settings
from app.database import supabase

_client = anthropic.AsyncAnthropic(api_key=settings.anthropic_api_key)


def _fmt_float(v) -> str:
    if v is None:
        return "-"
    try:
        return f"{float(v):.2f}"
    except (TypeError, ValueError):
        return str(v)


def _fmt_int(v) -> str:
    return "-" if v is None else str(v)


def _build_context(player: dict, career_stats: list[dict], fmt: str) -> str:
    """Build a ~1000 token system prompt with player data."""
    lines = [
        'You are a cricket analytics expert for "Cric No-It-All".',
        f'Answering questions about {player.get("full_name", "this player")} ({player.get("country", "Unknown")}).',
        "",
        "== PROFILE ==",
        f'DOB: {player.get("date_of_birth", "Unknown")} | '
        f'Batting: {player.get("batting_style", "Unknown")} | '
        f'Bowling: {player.get("bowling_style", "Unknown")}',
        "",
    ]

    # Find stats for the requested format
    stats = next((s for s in career_stats if s.get("format") == fmt), None)
    if stats:
        lines += [
            f"== {fmt.upper()} CAREER SUMMARY ==",
            "BATTING:",
            f'  Matches: {_fmt_int(stats.get("bat_matches"))} | '
            f'Innings: {_fmt_int(stats.get("bat_innings"))} | '
            f'Runs: {_fmt_int(stats.get("bat_runs"))} | '
            f'Avg: {_fmt_float(stats.get("bat_average"))} | '
            f'SR: {_fmt_float(stats.get("bat_strike_rate"))} | '
            f'HS: {stats.get("bat_highest", "-")} | '
            f'100s: {_fmt_int(stats.get("bat_hundreds"))} | '
            f'50s: {_fmt_int(stats.get("bat_fifties"))}',
            "BOWLING:",
            f'  Wickets: {_fmt_int(stats.get("bowl_wickets"))} | '
            f'Avg: {_fmt_float(stats.get("bowl_average"))} | '
            f'Econ: {_fmt_float(stats.get("bowl_economy"))} | '
            f'Best: {stats.get("bowl_best_innings", "-")}',
            "",
        ]

    # By opponent (top 10 by runs)
    opponents = (
        supabase.table("stats_by_opponent")
        .select("opponent,bat_runs,bat_innings,bat_average,bat_hundreds,bat_fifties")
        .eq("player_id", player["id"])
        .eq("format", fmt)
        .order("bat_runs", desc=True)
        .limit(10)
        .execute()
        .data
    )
    if opponents:
        lines.append("== BATTING BY OPPONENT (top 10 by runs) ==")
        for opp in opponents:
            lines.append(
                f'  vs {opp.get("opponent", "?")} — '
                f'Inns: {_fmt_int(opp.get("bat_innings"))} | '
                f'Runs: {_fmt_int(opp.get("bat_runs"))} | '
                f'Avg: {_fmt_float(opp.get("bat_average"))} | '
                f'100s/50s: {_fmt_int(opp.get("bat_hundreds"))}/{_fmt_int(opp.get("bat_fifties"))}'
            )
        lines.append("")

    # By year
    by_year = (
        supabase.table("stats_by_year")
        .select("year,bat_runs,bat_innings,bat_average,bat_strike_rate")
        .eq("player_id", player["id"])
        .eq("format", fmt)
        .order("year")
        .execute()
        .data
    )
    if by_year:
        lines.append("== BATTING BY YEAR ==")
        for y in by_year:
            lines.append(
                f'  {y.get("year")} — '
                f'Inns: {_fmt_int(y.get("bat_innings"))} | '
                f'Runs: {_fmt_int(y.get("bat_runs"))} | '
                f'Avg: {_fmt_float(y.get("bat_average"))} | '
                f'SR: {_fmt_float(y.get("bat_strike_rate"))}'
            )
        lines.append("")

    # Home/away
    home_away = (
        supabase.table("stats_home_away")
        .select("venue_type,bat_innings,bat_runs,bat_average,bat_hundreds")
        .eq("player_id", player["id"])
        .eq("format", fmt)
        .execute()
        .data
    )
    if home_away:
        lines.append("== HOME / AWAY SPLIT ==")
        for ha in home_away:
            lines.append(
                f'  {str(ha.get("venue_type", "?")).capitalize()} — '
                f'Inns: {_fmt_int(ha.get("bat_innings"))} | '
                f'Runs: {_fmt_int(ha.get("bat_runs"))} | '
                f'Avg: {_fmt_float(ha.get("bat_average"))} | '
                f'100s: {_fmt_int(ha.get("bat_hundreds"))}'
            )
        lines.append("")

    # Dismissals
    dismissals = (
        supabase.table("dismissal_stats")
        .select("bowler_name,dismissed_total,dismissed_bowled,dismissed_caught,dismissed_lbw")
        .eq("player_id", player["id"])
        .eq("format", fmt)
        .order("dismissed_total", desc=True)
        .limit(10)
        .execute()
        .data
    )
    if dismissals:
        lines.append("== DISMISSAL PATTERNS (top bowlers) ==")
        for d in dismissals:
            lines.append(
                f'  {d.get("bowler_name")} — '
                f'Total: {_fmt_int(d.get("dismissed_total"))} | '
                f'Bowled: {_fmt_int(d.get("dismissed_bowled"))} | '
                f'Caught: {_fmt_int(d.get("dismissed_caught"))} | '
                f'LBW: {_fmt_int(d.get("dismissed_lbw"))}'
            )
        lines.append("")

    lines.append(
        "Answer questions concisely using the data above. "
        "For questions outside the data, say you don't have that information. "
        "Use cricket terminology appropriately."
    )

    return "\n".join(lines)


async def stream_chat(
    session_id: str,
    player_id: str,
    format_context: str,
    user_message: str,
) -> AsyncIterator[str]:
    """
    Yield SSE-formatted chunks from Claude.
    Saves user + assistant messages to Supabase after streaming.
    """
    # Fetch player data
    player_result = (
        supabase.table("players").select("*").eq("id", player_id).single().execute()
    )
    player = player_result.data

    career_stats = (
        supabase.table("career_stats")
        .select("*")
        .eq("player_id", player_id)
        .execute()
        .data
    )

    system_prompt = _build_context(player, career_stats, format_context)

    # Fetch last 20 messages for conversation history
    history = (
        supabase.table("chat_messages")
        .select("role,content")
        .eq("session_id", session_id)
        .order("created_at")
        .limit(20)
        .execute()
        .data
    )

    messages = [{"role": m["role"], "content": m["content"]} for m in history]
    messages.append({"role": "user", "content": user_message})

    # Persist user message
    supabase.table("chat_messages").insert({
        "session_id": session_id,
        "role": "user",
        "content": user_message,
    }).execute()

    # Stream from Claude
    full_response = []
    async with _client.messages.stream(
        model="claude-sonnet-4-6",
        max_tokens=1024,
        system=system_prompt,
        messages=messages,
    ) as stream:
        async for text in stream.text_stream:
            full_response.append(text)
            yield f"data: {json.dumps({'text': text})}\n\n"

    # Persist assistant response
    supabase.table("chat_messages").insert({
        "session_id": session_id,
        "role": "assistant",
        "content": "".join(full_response),
    }).execute()

    # Update session last_active_at
    supabase.table("chat_sessions").update({
        "last_active_at": datetime.now(timezone.utc).isoformat()
    }).eq("id", session_id).execute()

    yield "data: [DONE]\n\n"
