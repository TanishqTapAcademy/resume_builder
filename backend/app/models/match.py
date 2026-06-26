"""Match request/response schemas (BACKEND.md §2 — validation only, no logic)."""
from pydantic import BaseModel, Field


class MatchRequest(BaseModel):
    """Body of POST /match. Profile is read from the store, not sent here."""

    jd: str = Field(..., min_length=1, description="The job description text.")
    company: str = Field(default="", description="Company name (context only).")


class MatchResult(BaseModel):
    """The fit verdict returned to the frontend."""

    score: int = Field(..., ge=0, le=100, description="Fit score 0-100.")
    fit: bool = Field(..., description="True if score >= the gate threshold.")
    missing: list[str] = Field(default_factory=list, description="What the JD wants that the profile lacks.")
    suggestions: list[str] = Field(default_factory=list, description="Concrete, non-fabricated improvements.")
