"""Resume-edit schemas (BACKEND.md §2 — validation only, no logic)."""
from pydantic import BaseModel, Field


class EditRequest(BaseModel):
    """Body of POST /resume/edit.

    The LaTeX source is held client-side (session memory) and sent back with each edit, so
    the server stays stateless. `jd` is optional context for relevance-aware edits.
    """

    tex: str = Field(..., min_length=1, description="Current LaTeX source of the resume.")
    message: str = Field(..., min_length=1, max_length=2000, description="The edit instruction.")
    jd: str = Field(default="", description="Target job description (context only).")


class EditResponse(BaseModel):
    """Result of one edit. On failure `ok` is False and `tex` echoes the unchanged source."""

    ok: bool
    reply: str
    section: str = ""
    tex: str
    pdf: str | None = None  # base64-encoded PDF, present only when ok
    warning: str = ""
