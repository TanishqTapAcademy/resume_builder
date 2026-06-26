"""POST /match route (BACKEND.md §0 rule 1: thin router).

Validates the request, calls the match service, shapes the response. Knows nothing
about how scoring works. Async — it awaits a model call (PRD §10).
"""
from fastapi import APIRouter, HTTPException

from app.models.match import MatchRequest, MatchResult
from app.services.ai_client import AIClientError
from app.services.match_service import match
from app.services.profile_service import ProfileNotFoundError

router = APIRouter(tags=["match"])


@router.post("/match", response_model=MatchResult)
async def match_endpoint(request: MatchRequest) -> MatchResult:
    """Score the stored profile against the given JD and return the fit verdict."""
    try:
        result = await match(request.jd, request.company)
    except ProfileNotFoundError as exc:
        raise HTTPException(status_code=404, detail=str(exc))
    except AIClientError as exc:
        raise HTTPException(status_code=503, detail=str(exc))

    return MatchResult(**result)
