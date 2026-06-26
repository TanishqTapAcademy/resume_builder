"""User store (accounts) — thin async data access over the `users` table.

HTTP-agnostic (BACKEND.md §0 rule 1): pure DB reads/writes, no FastAPI, no hashing
(that's auth_service's job). Returns plain dicts so callers stay decoupled from asyncpg.
"""
from app.db.database import get_pool


async def create_user(email: str, password_hash: str) -> dict:
    """Insert a new user and return {id, email, created_at}.

    Raises asyncpg.UniqueViolationError if the email already exists (caller maps it).
    """
    pool = get_pool()
    row = await pool.fetchrow(
        "INSERT INTO users (email, password_hash) VALUES ($1, $2) "
        "RETURNING id, email, created_at",
        email,
        password_hash,
    )
    return dict(row)


async def get_user_by_email(email: str) -> dict | None:
    """Return {id, email, password_hash, created_at} or None. Used at login."""
    pool = get_pool()
    row = await pool.fetchrow(
        "SELECT id, email, password_hash, created_at FROM users WHERE email = $1",
        email,
    )
    return dict(row) if row else None


async def get_user_by_id(user_id: str) -> dict | None:
    """Return {id, email, created_at} or None. Used to resolve the JWT subject."""
    pool = get_pool()
    row = await pool.fetchrow(
        "SELECT id, email, created_at FROM users WHERE id = $1::uuid",
        user_id,
    )
    return dict(row) if row else None
