"""POST /generate route (BACKEND.md §0 rule 1: thin router).

Validates the request, runs the generation + repair loop, returns the PDF (or a
clean 422 + log on hard failure). Async — it awaits model calls and compiles.
"""
from fastapi import APIRouter, HTTPException
from fastapi.responses import Response

from app.models.generate import GenerateRequest
from app.services.ai_client import AIClientError
from app.services.generation_service import generate
from app.services.profile_service import ProfileNotFoundError
from app.utils.errors import GenerationError

router = APIRouter(tags=["generate"])


@router.post(
    "/generate",
    responses={
        200: {"content": {"application/pdf": {}}, "description": "Tailored resume PDF"},
        422: {"description": "Generation failed (won't compile or fabrication persists)"},
    },
)
async def generate_endpoint(request: GenerateRequest) -> Response:
    """Generate a tailored, one-page, ATS-clean, grounded resume from profile + JD + template."""
    try:
        result = await generate(request.jd, request.company, request.reference_template)
    except ProfileNotFoundError as exc:
        raise HTTPException(status_code=404, detail=str(exc))
    except AIClientError as exc:
        raise HTTPException(status_code=503, detail=str(exc))
    except GenerationError as exc:
        raise HTTPException(status_code=422, detail={"message": exc.message, "log": exc.log})

    headers = {"Content-Disposition": 'inline; filename="resume.pdf"'}
    if result["warnings"]:
        headers["X-Resume-Warning"] = " | ".join(result["warnings"])
    return Response(content=result["pdf"], media_type="application/pdf", headers=headers)
