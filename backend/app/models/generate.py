"""Generate request schema (BACKEND.md §2 — validation only, no logic)."""
from pydantic import BaseModel, Field


class GenerateRequest(BaseModel):
    """Body of POST /generate. Profile + template come from the logged-in user's store.

    `score` is the fit score already computed at the match step — passed back so it can be
    saved to history WITHOUT a second AI call. Optional (null if they skipped Check fit).
    """

    jd: str = Field(..., min_length=1, description="Job description text.")
    score: int | None = Field(default=None, ge=0, le=100, description="Match score from /match.")


class GenerateResponse(BaseModel):
    """Result of POST /generate. The LaTeX source is returned so the client can hold it in
    session memory and feed the post-generation chat editor (POST /resume/edit)."""

    pdf: str = Field(..., description="Base64-encoded PDF.")
    tex: str = Field(..., description="The final LaTeX source.")
    warning: str = Field(default="", description="Non-fatal warning (e.g. couldn't fit one page).")
