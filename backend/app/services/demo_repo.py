"""Landing-demo IP gate (demo_usage) — one free generation per IP, then force login.

Only an IP + timestamp is stored; the visitor's resume/profile is never persisted (it
lives in their browser for the demo). HTTP-agnostic (BACKEND.md §0 rule 1).
"""
from app.db.database import get_pool


async def is_used(ip: str) -> bool:
    """True if this IP has already spent its one free demo generation."""
    pool = get_pool()
    row = await pool.fetchrow("SELECT 1 FROM demo_usage WHERE ip_address = $1::inet", ip)
    return row is not None


async def mark_used(ip: str, user_agent: str | None) -> None:
    """Record that this IP used its free demo. No-op if already recorded."""
    pool = get_pool()
    await pool.execute(
        """
        INSERT INTO demo_usage (ip_address, user_agent)
        VALUES ($1::inet, $2)
        ON CONFLICT (ip_address) DO NOTHING
        """,
        ip,
        user_agent,
    )


async def check_and_count_extract(ip: str, limit: int) -> dict:
    """Reserve one demo extraction for today if under `limit` (cost guard).

    Returns {allowed, remaining}. Increments the per-IP/day counter only when allowed;
    at the cap nothing is incremented and allowed=False (the route returns 429).
    """
    pool = get_pool()
    async with pool.acquire() as conn:
        async with conn.transaction():
            current = await conn.fetchval(
                "SELECT count FROM demo_rate WHERE ip_address = $1::inet AND day = CURRENT_DATE",
                ip,
            )
            current = current or 0
            if current >= limit:
                return {"allowed": False, "remaining": 0}
            new_count = await conn.fetchval(
                """
                INSERT INTO demo_rate (ip_address, day, count)
                VALUES ($1::inet, CURRENT_DATE, 1)
                ON CONFLICT (ip_address, day) DO UPDATE SET count = demo_rate.count + 1
                RETURNING count
                """,
                ip,
            )
            return {"allowed": True, "remaining": limit - new_count}
