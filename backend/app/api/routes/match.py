"""POST /match route (BACKEND.md §0 rule 1: thin router). Auth-guarded, per-user.

Validates the request, loads the logged-in user's profile, calls the match service.
Async — it awaits a model call (PRD §10).
"""
from fastapi import APIRouter, Depends, HTTPException

from app.api.deps import get_current_user
from app.models.match import MatchRequest, MatchResult
from app.services import profile_repo
from app.services.ai_client import AIClientError
from app.services.match_service import match

router = APIRouter(tags=["match"])


@router.post("/match", response_model=MatchResult)
async def match_endpoint(
    request: MatchRequest, user: dict = Depends(get_current_user)
) -> MatchResult:
    """Score the current user's profile against the given JD and return the fit verdict."""
    profile = await profile_repo.get_profile(user["id"])
    if profile is None:
        raise HTTPException(status_code=409, detail="Set up your profile first.")
    try:
        result = await match(profile["data"], request.jd)
    except AIClientError as exc:
        raise HTTPException(status_code=503, detail=str(exc))

    return MatchResult(**result)
