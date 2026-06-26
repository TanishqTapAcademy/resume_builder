"""POST /generate route (BACKEND.md §0 rule 1: thin router). Auth-guarded, per-user.

Loads the logged-in user's profile + their stored LaTeX template (or the default), runs
the generation + repair loop, records a minimal history row, and returns the PDF (or a
clean error). Async — it awaits model calls and compiles.
"""
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import Response

from app.api.deps import get_current_user
from app.models.generate import GenerateRequest
from app.services import profile_repo, resume_repo
from app.services.ai_client import AIClientError
from app.services.generation_service import default_template, generate
from app.utils.errors import GenerationError

router = APIRouter(tags=["generate"])


@router.post(
    "/generate",
    responses={
        200: {"content": {"application/pdf": {}}, "description": "Tailored resume PDF"},
        422: {"description": "Generation failed (won't compile or fabrication persists)"},
    },
)
async def generate_endpoint(
    request: GenerateRequest, user: dict = Depends(get_current_user)
) -> Response:
    """Generate a tailored, one-page, ATS-clean, grounded resume for the current user."""
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

    headers = {"Content-Disposition": 'inline; filename="resume.pdf"'}
    if result["warnings"]:
        headers["X-Resume-Warning"] = " | ".join(result["warnings"])
    return Response(content=result["pdf"], media_type="application/pdf", headers=headers)
