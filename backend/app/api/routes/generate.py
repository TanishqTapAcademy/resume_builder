"""POST /generate route (BACKEND.md §0 rule 1: thin router). Auth-guarded, per-user.

Loads the logged-in user's profile + their stored LaTeX template (or the default), runs
the generation + repair loop, records a minimal history row, and returns the PDF (or a
clean error). Async — it awaits model calls and compiles.
"""
import base64

from fastapi import APIRouter, Depends, HTTPException

from app.api.deps import get_current_user
from app.models.generate import GenerateRequest, GenerateResponse
from app.services import profile_repo, resume_repo
from app.services.ai_client import AIClientError
from app.services.generation_service import default_template, generate
from app.utils.errors import GenerationError

router = APIRouter(tags=["generate"])


@router.post(
    "/generate",
    response_model=GenerateResponse,
    responses={
        422: {"description": "Generation failed (won't compile or fabrication persists)"},
    },
)
async def generate_endpoint(
    request: GenerateRequest, user: dict = Depends(get_current_user)
) -> GenerateResponse:
    """Generate a tailored, one-page, ATS-clean, grounded resume for the current user.

    Returns JSON: the base64 PDF plus the LaTeX source, so the client can hold the source in
    session memory and drive the post-generation chat editor without re-fetching it.
    """
    profile = await profile_repo.get_profile(user["id"])
    if profile is None:
        raise HTTPException(status_code=409, detail="Set up your profile first.")

    # Use the user's own LaTeX template (from an Overleaf paste) or the default look.
    template = profile.get("template") or default_template()

    try:
        result = await generate(profile["data"], request.jd, "", template)
    except AIClientError as exc:
        raise HTTPException(status_code=503, detail=str(exc))
    except GenerationError as exc:
        raise HTTPException(status_code=422, detail={"message": exc.message, "log": exc.log})

    # History: reuse the score from the match step (no recompute). Best-effort.
    await resume_repo.record_resume(user["id"], "", request.score)

    return GenerateResponse(
        pdf=base64.b64encode(result["pdf"]).decode("ascii"),
        tex=result["tex"],
        warning=" | ".join(result["warnings"]) if result["warnings"] else "",
    )
