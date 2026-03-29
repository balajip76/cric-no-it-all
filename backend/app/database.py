"""
Database clients:
- supabase_client: supabase-py with service role key (bypasses RLS for writes)
- asyncpg pool: direct Postgres for bulk reads in FastAPI
"""
import asyncpg
from supabase import create_client, Client as SupabaseClient

from app.config import settings

# Supabase service-role client (used by scrapers for writes)
supabase: SupabaseClient = create_client(
    settings.supabase_url,
    settings.supabase_service_role_key,
)

# asyncpg connection pool (initialized on app startup)
_pool: asyncpg.Pool | None = None


async def get_pool() -> asyncpg.Pool:
    global _pool
    if _pool is None:
        # Convert SQLAlchemy URL style to plain asyncpg URL
        url = settings.database_url.replace("postgresql+asyncpg://", "postgresql://")
        _pool = await asyncpg.create_pool(url, min_size=2, max_size=10)
    return _pool


async def close_pool() -> None:
    global _pool
    if _pool:
        await _pool.close()
        _pool = None
