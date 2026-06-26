"""Generate request schema (BACKEND.md §2 — validation only, no logic)."""
from pydantic import BaseModel, Field


class GenerateRequest(BaseModel):
    """Body of POST /generate. Profile + template come from the logged-in user's store.

    `score` is the fit score already computed at the match step — passed back so it can be
    saved to history WITHOUT a second AI call. Optional (null if they skipped Check fit).
    """

    jd: str = Field(..., min_length=1, description="Job description text.")
    score: int | None = Field(default=None, ge=0, le=100, description="Match score from /match.")
