from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse
from pydantic import BaseModel

from app.database import supabase
from app.services.chat_service import stream_chat

router = APIRouter()


class CreateSessionRequest(BaseModel):
    howstat_id: int
    format_context: str = "test"  # test | odi | t20i


class SendMessageRequest(BaseModel):
    message: str


@router.post("/sessions")
async def create_session(body: CreateSessionRequest):
    """Create a new chat session for a player + format combination."""
    player = (
        supabase.table("players")
        .select("id")
        .eq("howstat_id", body.howstat_id)
        .maybe_single()
        .execute()
    )
    if not player.data:
        raise HTTPException(status_code=404, detail="Player not found. Trigger scrape first.")

    result = (
        supabase.table("chat_sessions")
        .insert({
            "player_id": player.data["id"],
            "format_context": body.format_context,
        })
        .execute()
    )
    return result.data[0]


@router.post("/sessions/{session_id}/messages")
async def send_message(session_id: str, body: SendMessageRequest):
    """Send a message and receive a streamed SSE response from Claude."""
    session = (
        supabase.table("chat_sessions")
        .select("*")
        .eq("id", session_id)
        .maybe_single()
        .execute()
    )
    if not session.data:
        raise HTTPException(status_code=404, detail="Session not found.")

    s = session.data
    return StreamingResponse(
        stream_chat(
            session_id=session_id,
            player_id=s["player_id"],
            format_context=s["format_context"],
            user_message=body.message,
        ),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no",
        },
    )


@router.delete("/sessions/{session_id}")
async def delete_session(session_id: str):
    """Delete a chat session and all its messages."""
    supabase.table("chat_messages").delete().eq("session_id", session_id).execute()
    supabase.table("chat_sessions").delete().eq("id", session_id).execute()
    return {"status": "deleted"}
