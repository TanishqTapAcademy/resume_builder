"""Resume edit route (BACKEND.md §0 rule 1: thin router). Auth-guarded, per-user.

POST /resume/edit -> apply one natural-language, section-scoped edit to a generated resume
and return the recompiled PDF. Stateless: the client sends the current LaTeX with each call
(session memory), so nothing is stored server-side.
"""
import base64
import logging

from fastapi import APIRouter, Depends, HTTPException

from app.api.deps import get_current_user
from app.models.resume import EditRequest, EditResponse
from app.services import profile_repo
from app.services.ai_client import AIClientError
from app.services.resume_edit_service import edit_resume

logger = logging.getLogger("resume")

router = APIRouter(prefix="/resume", tags=["resume"])


@router.post("/edit", response_model=EditResponse)
async def edit_resume_endpoint(
    request: EditRequest, user: dict = Depends(get_current_user)
) -> EditResponse:
    """Edit the section of `tex` that the instruction targets; return the new PDF + LaTeX."""
    profile = await profile_repo.get_profile(user["id"])
    if profile is None:
        raise HTTPException(status_code=409, detail="Set up your profile first.")

    try:
        result = await edit_resume(request.tex, request.message, request.jd, profile["data"])
    except AIClientError as exc:
        raise HTTPException(status_code=503, detail=str(exc))

    pdf_b64 = base64.b64encode(result["pdf"]).decode("ascii") if result.get("pdf") else None
    return EditResponse(
        ok=result["ok"],
        reply=result["reply"],
        section=result.get("section", ""),
        tex=result.get("tex", request.tex),  # unchanged source echoed back on failure
        pdf=pdf_b64,
        warning=result.get("warning", ""),
    )
