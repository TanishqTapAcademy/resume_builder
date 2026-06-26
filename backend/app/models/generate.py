"""Generate request schema (BACKEND.md §2 — validation only, no logic)."""
from pydantic import BaseModel, ConfigDict, Field


class GenerateRequest(BaseModel):
    """Body of POST /generate. Profile is read from the store, not sent here."""

    model_config = ConfigDict(populate_by_name=True)

    jd: str = Field(..., min_length=1, description="Job description text.")
    company: str = Field(default="", description="Company name (context only).")
    reference_template: str = Field(
        ...,
        min_length=1,
        alias="referenceTemplate",
        description="A sample LaTeX resume whose look/structure to mimic.",
    )
