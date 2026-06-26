"""Public landing-demo routes (NO auth). One free tailored resume per IP, then 403.

Flow (all browser-held, nothing saved server-side except the IP gate):
  POST /demo/extract/pdf | /demo/extract/latex -> build a profile from the visitor's resume
  POST /demo/generate                          -> one tailored PDF, then mark the IP used
  GET  /demo/status                            -> has this IP already used its free demo?

The gate guards both extract and generate: once the free generation is spent, every demo
call returns 403 so the frontend can push the visitor to sign up / log in.
"""
from fastapi import APIRouter, File, HTTPException, Request, UploadFile
from fastapi.responses import Response

from app.core.config import get_settings
from app.models.demo import (
    DemoExtractLatexRequest,
    DemoGenerateRequest,
    DemoProfileResponse,
    DemoStatusResponse,
)
from app.services import demo_repo, profile_ai
from app.services.ai_client import AIClientError
from app.services.generation_service import default_template, generate
from app.services.pdf_service import PdfParseError, extract_text
from app.utils.errors import GenerationError

router = APIRouter(prefix="/demo", tags=["demo"])

_LOCKED = "You've used your free demo. Sign up or log in to keep going — it's free."


def _client_ip(request: Request) -> str:
    """Best-effort client IP: first X-Forwarded-For hop (proxies) else the socket peer."""
    fwd = request.headers.get("x-forwarded-for")
    if fwd:
        return fwd.split(",")[0].strip()
    return request.client.host if request.client else "0.0.0.0"


async def _ensure_not_used(request: Request) -> None:
    if await demo_repo.is_used(_client_ip(request)):
        raise HTTPException(status_code=403, detail=_LOCKED)


async def _ensure_extract_quota(request: Request) -> None:
    """Per-IP daily cap on extractions (cost guard for the public gpt-4.1 calls)."""
    limit = get_settings().demo_extract_daily_limit
    quota = await demo_repo.check_and_count_extract(_client_ip(request), limit)
    if not quota["allowed"]:
        raise HTTPException(
            status_code=429,
            detail="Too many demo tries. Sign up to keep going — it's free.",
        )


@router.get("/status", response_model=DemoStatusResponse)
async def demo_status(request: Request) -> DemoStatusResponse:
    """Tell the frontend whether this IP has already spent its free demo."""
    return DemoStatusResponse(used=await demo_repo.is_used(_client_ip(request)))


@router.post("/extract/latex", response_model=DemoProfileResponse)
async def demo_extract_latex(
    body: DemoExtractLatexRequest, request: Request
) -> DemoProfileResponse:
    await _ensure_not_used(request)
    await _ensure_extract_quota(request)
    try:
        profile = await profile_ai.extract_profile(body.code)
    except AIClientError as exc:
        raise HTTPException(status_code=503, detail=str(exc))
    return DemoProfileResponse(profile=profile)


@router.post("/extract/pdf", response_model=DemoProfileResponse)
async def demo_extract_pdf(
    request: Request, file: UploadFile = File(...)
) -> DemoProfileResponse:
    await _ensure_not_used(request)
    await _ensure_extract_quota(request)
    settings = get_settings()
    pdf_bytes = await file.read()
    if len(pdf_bytes) > settings.max_pdf_bytes:
        raise HTTPException(status_code=413, detail="PDF too large.")
    try:
        raw_text = extract_text(pdf_bytes)
    except PdfParseError as exc:
        raise HTTPException(status_code=422, detail=str(exc))
    try:
        profile = await profile_ai.extract_profile(raw_text)
    except AIClientError as exc:
        raise HTTPException(status_code=503, detail=str(exc))
    return DemoProfileResponse(profile=profile)


@router.post("/generate")
async def demo_generate(body: DemoGenerateRequest, request: Request) -> Response:
    """Generate one tailored PDF from the browser-held profile, then lock this IP."""
    ip = _client_ip(request)
    if await demo_repo.is_used(ip):
        raise HTTPException(status_code=403, detail=_LOCKED)

    template = body.template or default_template()
    try:
        result = await generate(body.profile, body.jd, "", template)
    except AIClientError as exc:
        raise HTTPException(status_code=503, detail=str(exc))
    except GenerationError as exc:
        raise HTTPException(status_code=422, detail={"message": exc.message, "log": exc.log})

    # Spend the free demo only on a successful generation.
    await demo_repo.mark_used(ip, request.headers.get("user-agent"))

    headers = {"Content-Disposition": 'inline; filename="resume.pdf"'}
    if result["warnings"]:
        headers["X-Resume-Warning"] = " | ".join(result["warnings"])
    return Response(content=result["pdf"], media_type="application/pdf", headers=headers)
