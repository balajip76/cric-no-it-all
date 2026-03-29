from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.database import get_pool, close_pool
from app.routers import players, chat
from app.tasks.scheduler import start_scheduler


@asynccontextmanager
async def lifespan(app: FastAPI):
    await get_pool()
    start_scheduler()
    yield
    await close_pool()


app = FastAPI(
    title="Cric No-It-All API",
    version="0.1.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "https://*.vercel.app"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(players.router, prefix="/api/v1/players", tags=["players"])
app.include_router(chat.router, prefix="/api/v1/chat", tags=["chat"])


@app.get("/health")
async def health():
    return {"status": "ok"}
