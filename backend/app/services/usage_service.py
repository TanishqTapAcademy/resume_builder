"""Usage counters — the profile-chat daily cap (cost guard).

Only a per-day COUNT is stored (chat_usage), never the conversation itself — chats are
session-only and live in the frontend. HTTP-agnostic (BACKEND.md §0 rule 1).
"""
from app.db.database import get_pool


async def check_and_count_chat(user_id: str, limit: int) -> dict:
    """Reserve one chat message for today if under `limit`.

    Returns {allowed, used, remaining}. When allowed, today's counter is incremented;
    when the cap is already reached, nothing is incremented and allowed=False.
    """
    pool = get_pool()
    async with pool.acquire() as conn:
        async with conn.transaction():
            current = await conn.fetchval(
                "SELECT count FROM chat_usage WHERE user_id = $1::uuid AND day = CURRENT_DATE",
                user_id,
            )
            current = current or 0
            if current >= limit:
                return {"allowed": False, "used": current, "remaining": 0}
            new_count = await conn.fetchval(
                """
                INSERT INTO chat_usage (user_id, day, count)
                VALUES ($1::uuid, CURRENT_DATE, 1)
                ON CONFLICT (user_id, day) DO UPDATE SET count = chat_usage.count + 1
                RETURNING count
                """,
                user_id,
            )
            return {"allowed": True, "used": new_count, "remaining": limit - new_count}
