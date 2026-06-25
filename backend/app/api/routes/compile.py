"""POST /compile route (BACKEND.md §0 rule 1: thin router).

Validates the request, calls the service, shapes the HTTP response. The route
knows nothing about how compiling works; the service knows nothing about HTTP.
"""
from fastapi import APIRouter, HTTPException
from fastapi.responses import Response

from app.models.compile import CompileRequest
from app.services.latex_service import compile_latex
from app.utils.errors import LatexCompileError

router = APIRouter(tags=["compile"])


@router.post(
    "/compile",
    responses={
        200: {"content": {"application/pdf": {}}, "description": "Compiled PDF"},
        422: {"description": "LaTeX compilation failed"},
    },
)
def compile_endpoint(request: CompileRequest) -> Response:
    """Receive LaTeX source, return the compiled PDF bytes."""
    try:
        pdf = compile_latex(request.code, engine=request.engine)
    except LatexCompileError as exc:
        raise HTTPException(
            status_code=422,
            detail={"message": exc.message, "log": exc.log},
        )

    return Response(
        content=pdf,
        media_type="application/pdf",
        headers={"Content-Disposition": 'inline; filename="resume.pdf"'},
    )
