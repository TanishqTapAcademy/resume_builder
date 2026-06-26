"""Database access — a single asyncpg pool, opened once at startup (BACKEND.md §0).

HTTP-agnostic: services import `get_pool()` and run queries; routers never touch SQL.
The pool is created in the app lifespan (main.py) and the schema is applied on boot
(idempotent CREATE ... IF NOT EXISTS), so a fresh database self-initializes.
"""
import logging
from pathlib import Path

import asyncpg

from app.core.config import get_settings

logger = logging.getLogger("database")

_pool: asyncpg.Pool | None = None

_SCHEMA_PATH = Path(__file__).resolve().parent / "schema.sql"


class DatabaseNotConfiguredError(RuntimeError):
    """Raised when a DB-backed path runs but DATABASE_URL was never set."""


async def init_db() -> None:
    """Open the connection pool and apply the schema. Call once at startup."""
    global _pool
    settings = get_settings()
    if not settings.database_url:
        raise DatabaseNotConfiguredError(
            "DATABASE_URL is not set — configure it in .env."
        )
    _pool = await asyncpg.create_pool(
        dsn=settings.database_url, min_size=1, max_size=10
    )
    async with _pool.acquire() as conn:
        await conn.execute(_SCHEMA_PATH.read_text(encoding="utf-8"))
    logger.info("database pool ready; schema applied")


async def close_db() -> None:
    """Close the pool on shutdown."""
    global _pool
    if _pool is not None:
        await _pool.close()
        _pool = None


def get_pool() -> asyncpg.Pool:
    """Return the live pool, or fail clearly if startup didn't run."""
    if _pool is None:
        raise DatabaseNotConfiguredError("Database pool is not initialized.")
    return _pool
