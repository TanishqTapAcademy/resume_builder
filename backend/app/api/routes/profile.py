"""Profile routes (BACKEND.md §0 rule 1: thin router).

GET /profile  -> the profile as raw JSON (single source of truth).
PUT /profile  -> replace it with whatever JSON is sent.

Deliberately permissive: the profile is freeform JSON (LLM.md §1). The router does
NOT validate its shape — any JSON object is accepted and stored as-is, so the profile
can be reshaped freely without the API rejecting it.
"""
from fastapi import APIRouter, Body, HTTPException

from app.services.profile_service import (
    ProfileNotFoundError,
    load_profile,
    save_profile,
)

router = APIRouter(tags=["profile"])


@router.get("/profile")
def get_profile() -> dict:
    """Return the profile as raw JSON."""
    try:
        return load_profile()
    except ProfileNotFoundError as exc:
        raise HTTPException(status_code=404, detail=str(exc))


@router.put("/profile")
def put_profile(profile: dict = Body(...)) -> dict:
    """Store whatever JSON object is sent and return it. No shape enforced."""
    return save_profile(profile)
