"""Generation history (minimal) — one row per generated resume.

Per the product decision we store ONLY {user_id, company, score}: no LaTeX, no PDF, and
the score is the one already computed at match time (reused, never recomputed here).

HTTP-agnostic (BACKEND.md §0 rule 1).
"""
from app.db.database import get_pool


async def record_resume(user_id: str, company: str, score: int | None) -> None:
    """Insert a history row for a successful generation (best-effort, no return)."""
    pool = get_pool()
    await pool.execute(
        "INSERT INTO resumes (user_id, company, score) VALUES ($1::uuid, $2, $3)",
        user_id,
        company or "",
        score,
    )


async def list_resumes(user_id: str, limit: int = 20) -> list[dict]:
    """Return the user's recent generations (newest first)."""
    pool = get_pool()
    rows = await pool.fetch(
        "SELECT company, score, created_at FROM resumes "
        "WHERE user_id = $1::uuid ORDER BY created_at DESC LIMIT $2",
        user_id,
        limit,
    )
    return [dict(r) for r in rows]
