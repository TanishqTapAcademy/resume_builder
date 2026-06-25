"""Request/response schemas for compiling (BACKEND.md §2 — validation only, no logic)."""
from pydantic import BaseModel, Field


class CompileRequest(BaseModel):
    """Body of POST /compile."""

    code: str = Field(
        ...,
        min_length=1,
        description="The full LaTeX source to compile.",
    )
    engine: str = Field(
        default="pdflatex",
        description="LaTeX engine to use (pdflatex by default).",
    )


class CompileErrorResponse(BaseModel):
    """Returned (HTTP 422) when compilation fails."""

    message: str
    log: str = ""
