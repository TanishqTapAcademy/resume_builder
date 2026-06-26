"""Per-user profile store (DB) — one profile row per user (LLM.md §1, multi-user).

Replaces the old single-file profile for the HTTP layer. The profile `data` is freeform
JSON (any shape), stored in a jsonb column. `template` holds the user's LaTeX template
(from an Overleaf paste); NULL means "use the default template" at generation time.

HTTP-agnostic (BACKEND.md §0 rule 1): plain async DB access, returns dicts.
"""
import json

from app.db.database import get_pool


async def get_profile(user_id: str) -> dict | None:
    """Return {data, source, template, updated_at} for the user, or None if none yet."""
    pool = get_pool()
    row = await pool.fetchrow(
        "SELECT data, source, template, updated_at FROM profiles WHERE user_id = $1::uuid",
        user_id,
    )
    if row is None:
        return None
    return {
        # asyncpg returns jsonb as a string -> parse to dict.
        "data": json.loads(row["data"]) if isinstance(row["data"], str) else row["data"],
        "source": row["source"],
        "template": row["template"],
        "updated_at": row["updated_at"],
    }


async def upsert_profile(
    user_id: str, data: dict, source: str, template: str | None = None
) -> dict:
    """Create or replace the user's profile (used by the two seeding doors).

    `template` is only overwritten when a non-None value is passed, so re-seeding from a
    PDF (template=None) never wipes a template the user set via Overleaf.
    """
    pool = get_pool()
    row = await pool.fetchrow(
        """
        INSERT INTO profiles (user_id, data, source, template)
        VALUES ($1::uuid, $2::jsonb, $3, $4)
        ON CONFLICT (user_id) DO UPDATE
          SET data = EXCLUDED.data,
              source = EXCLUDED.source,
              template = COALESCE(EXCLUDED.template, profiles.template),
              updated_at = now()
        RETURNING data, source, template, updated_at
        """,
        user_id,
        json.dumps(data),
        source,
        template,
    )
    return {
        "data": json.loads(row["data"]) if isinstance(row["data"], str) else row["data"],
        "source": row["source"],
        "template": row["template"],
        "updated_at": row["updated_at"],
    }


async def update_profile_data(user_id: str, data: dict) -> dict | None:
    """Save edited profile JSON (the PUT path / chat-approved changes). None if no profile."""
    pool = get_pool()
    row = await pool.fetchrow(
        """
        UPDATE profiles SET data = $2::jsonb, updated_at = now()
        WHERE user_id = $1::uuid
        RETURNING data, source, template, updated_at
        """,
        user_id,
        json.dumps(data),
    )
    if row is None:
        return None
    return {
        "data": json.loads(row["data"]) if isinstance(row["data"], str) else row["data"],
        "source": row["source"],
        "template": row["template"],
        "updated_at": row["updated_at"],
    }
