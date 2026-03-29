"""
Shared httpx client with:
- Semaphore-based concurrency limiting (max 3 parallel requests)
- Random delay between requests (1.5–3.0 s)
- Exponential backoff + jitter on 429/503, up to 3 retries
"""
import asyncio
import random

import httpx
from tenacity import (
    retry,
    retry_if_exception,
    stop_after_attempt,
    wait_exponential_jitter,
)

from app.config import settings

BASE_URL = "http://www.howstat.com/cricket/Statistics/Players"

HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
        "AppleWebKit/537.36 (KHTML, like Gecko) "
        "Chrome/124.0.0.0 Safari/537.36"
    ),
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    "Accept-Language": "en-US,en;q=0.9",
}

_semaphore = asyncio.Semaphore(settings.scraper_max_concurrency)
_client: httpx.AsyncClient | None = None


def _get_client() -> httpx.AsyncClient:
    global _client
    if _client is None or _client.is_closed:
        _client = httpx.AsyncClient(
            headers=HEADERS,
            follow_redirects=True,
            timeout=httpx.Timeout(30.0),
        )
    return _client


def _is_retryable(exc: BaseException) -> bool:
    if isinstance(exc, httpx.HTTPStatusError):
        return exc.response.status_code in (429, 503)
    return isinstance(exc, (httpx.TimeoutException, httpx.ConnectError))


@retry(
    retry=retry_if_exception(_is_retryable),
    stop=stop_after_attempt(settings.scraper_max_retries),
    wait=wait_exponential_jitter(initial=2, max=30, jitter=3),
    reraise=True,
)
async def _fetch(url: str) -> str:
    async with _semaphore:
        delay = random.uniform(settings.scraper_min_delay, settings.scraper_max_delay)
        await asyncio.sleep(delay)
        response = await _get_client().get(url)
        response.raise_for_status()
        return response.text


async def fetch_page(path: str) -> str:
    """Fetch a howstat page by its path relative to BASE_URL."""
    url = f"{BASE_URL}/{path}"
    return await _fetch(url)


async def close_client() -> None:
    global _client
    if _client and not _client.is_closed:
        await _client.aclose()
        _client = None
