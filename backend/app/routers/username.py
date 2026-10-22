import asyncio
import time

import httpx
from fastapi import APIRouter

from app.ml.identity_correlation import compute_identity_confidence

router = APIRouter(prefix="/api/username", tags=["Username Investigation"])

PLATFORMS = {
    "GitHub": "https://github.com/{}",
    "GitLab": "https://gitlab.com/{}",
    "Twitter": "https://twitter.com/{}",
    "Instagram": "https://instagram.com/{}",
    "Reddit": "https://reddit.com/user/{}",
    "TikTok": "https://tiktok.com/@{}",
    "LinkedIn": "https://linkedin.com/in/{}",
    "YouTube": "https://youtube.com/@{}",
    "Pinterest": "https://pinterest.com/{}",
    "Twitch": "https://twitch.tv/{}",
    "Medium": "https://medium.com/@{}",
    "DevTo": "https://dev.to/{}",
    "HackerNews": "https://news.ycombinator.com/user?id={}",
    "Keybase": "https://keybase.io/{}",
    "Steam": "https://steamcommunity.com/id/{}",
    "Telegram": "https://t.me/{}",
    "Mastodon": "https://mastodon.social/@{}",
    "SoundCloud": "https://soundcloud.com/{}",
    "Dribbble": "https://dribbble.com/{}",
    "ProductHunt": "https://www.producthunt.com/@{}",
}

# Cap concurrent outbound requests so a run of 20 platforms behaves like a
# well-mannered client rather than a burst hammer against many hosts at once.
CONCURRENCY_LIMIT = 8


async def check_platform(client, sem, platform, url, username):
    t0 = time.monotonic()
    async with sem:
        try:
            response = await client.get(
                url.format(username),
                timeout=10,
                follow_redirects=True
            )
            exists = response.status_code == 200
            return {
                "platform": platform,
                "url": url.format(username),
                "exists": exists,
                "status_code": response.status_code,
                "response_ms": round((time.monotonic() - t0) * 1000, 1),
            }
        except Exception as e:
            return {
                "platform": platform,
                "url": url.format(username),
                "exists": False,
                "error": str(e),
                "response_ms": round((time.monotonic() - t0) * 1000, 1),
            }


@router.get("/{username}")
async def investigate_username(username: str):
    t0 = time.monotonic()
    sem = asyncio.Semaphore(CONCURRENCY_LIMIT)

    async with httpx.AsyncClient(
        headers={"User-Agent": "Mozilla/5.0"},
        follow_redirects=True
    ) as client:
        tasks = [
            check_platform(client, sem, platform, url, username)
            for platform, url in PLATFORMS.items()
        ]
        results = await asyncio.gather(*tasks)

    found = sorted((r for r in results if r.get("exists")), key=lambda r: r["platform"])
    not_found = sorted((r for r in results if not r.get("exists")), key=lambda r: r["platform"])
    identity_confidence = compute_identity_confidence(username, found)

    return {
        "username": username,
        "total_checked": len(PLATFORMS),
        "found_count": len(found),
        "found": found,
        "not_found": not_found,
        "identity_confidence": identity_confidence,
        "scan_time_ms": round((time.monotonic() - t0) * 1000, 1),
    }
