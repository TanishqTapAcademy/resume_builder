"""Profile routes (BACKEND.md §0 rule 1: thin router). All per-user, all auth-guarded.

GET  /profile            -> the user's profile (404 if they haven't created one yet).
PUT  /profile            -> save edited profile JSON (raw edit / chat-approved changes).
POST /profile/seed/latex -> paste Overleaf/LaTeX -> AI extract -> save (+ store template).
POST /profile/seed/pdf   -> upload resume PDF -> parse -> AI extract -> save.
POST /profile/chat       -> session chat editor -> {reply, changes, remaining} (10/day cap).

The profile is freeform JSON (LLM.md §1): shape is not validated, just stored as-is.
"""
from fastapi import APIRouter, Body, Depends, File, HTTPException, UploadFile

from app.api.deps import get_current_user
from app.core.config import get_settings
from app.models.profile import (
    ChatRequest,
    ChatResponse,
    ProfileResponse,
    SeedLatexRequest,
)
from app.services import profile_ai, profile_repo, usage_service
from app.services.ai_client import AIClientError
from app.services.pdf_service import PdfParseError, extract_text

router = APIRouter(prefix="/profile", tags=["profile"])


def _shape(profile: dict) -> ProfileResponse:
    return ProfileResponse(
        data=profile["data"],
        source=profile["source"],
        hasTemplate=bool(profile.get("template")),
    )


@router.get("", response_model=ProfileResponse)
async def get_profile(user: dict = Depends(get_current_user)) -> ProfileResponse:
    """Return the current user's profile, or 404 if they haven't created one yet."""
    profile = await profile_repo.get_profile(user["id"])
    if profile is None:
        raise HTTPException(status_code=404, detail="No profile yet.")
    return _shape(profile)


@router.put("", response_model=ProfileResponse)
async def put_profile(
    data: dict = Body(...), user: dict = Depends(get_current_user)
) -> ProfileResponse:
    """Save edited profile JSON as-is (no shape enforced). 404 if no profile exists."""
    profile = await profile_repo.update_profile_data(user["id"], data)
    if profile is None:
        raise HTTPException(status_code=404, detail="No profile to update — seed one first.")
    return _shape(profile)


@router.post("/seed/latex", response_model=ProfileResponse)
async def seed_latex(
    request: SeedLatexRequest, user: dict = Depends(get_current_user)
) -> ProfileResponse:
    """Build the profile from pasted LaTeX, and keep that LaTeX as the user's template."""
    try:
        data = await profile_ai.extract_profile(request.code)
    except AIClientError as exc:
        raise HTTPException(status_code=503, detail=str(exc))
    profile = await profile_repo.upsert_profile(
        user["id"], data, source="latex", template=request.code
    )
    return _shape(profile)


@router.post("/seed/pdf", response_model=ProfileResponse)
async def seed_pdf(
    file: UploadFile = File(...), user: dict = Depends(get_current_user)
) -> ProfileResponse:
    """Build the profile from an uploaded resume PDF (parse -> AI extract -> save)."""
    settings = get_settings()
    pdf_bytes = await file.read()
    if len(pdf_bytes) > settings.max_pdf_bytes:
        raise HTTPException(status_code=413, detail="PDF too large.")
    try:
        raw_text = extract_text(pdf_bytes)
    except PdfParseError as exc:
        raise HTTPException(status_code=422, detail=str(exc))
    try:
        data = await profile_ai.extract_profile(raw_text)
    except AIClientError as exc:
        raise HTTPException(status_code=503, detail=str(exc))
    profile = await profile_repo.upsert_profile(user["id"], data, source="pdf")
    return _shape(profile)


@router.post("/chat", response_model=ChatResponse)
async def chat(
    request: ChatRequest, user: dict = Depends(get_current_user)
) -> ChatResponse:
    """Session chat editor: propose changes (partial patch) without saving. 10/day cap."""
    settings = get_settings()
    quota = await usage_service.check_and_count_chat(user["id"], settings.chat_daily_limit)
    if not quota["allowed"]:
        raise HTTPException(
            status_code=429,
            detail=f"Daily chat limit reached ({settings.chat_daily_limit}/day). Try again tomorrow.",
        )
    try:
        result = await profile_ai.chat_edit(
            request.profile, request.message, [t.model_dump() for t in request.history]
        )
    except AIClientError as exc:
        raise HTTPException(status_code=503, detail=str(exc))
    return ChatResponse(
        reply=result["reply"], changes=result["changes"], remaining=quota["remaining"]
    )
