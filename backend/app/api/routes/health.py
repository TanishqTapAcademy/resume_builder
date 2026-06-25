"""Health-check route — confirms the server is alive.

Thin router (BACKEND.md §0 rule 1): no logic here beyond returning status.
"""
from fastapi import APIRouter

router = APIRouter(tags=["health"])


@router.get("/")
def health() -> dict:
    """Liveness probe. Returns ok when the API is up."""
    return {"status": "ok", "service": "resume-builder-backend"}
