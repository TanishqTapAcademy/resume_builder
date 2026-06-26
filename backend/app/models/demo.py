"""Demo request/response schemas (BACKEND.md §2 — validation only, no logic).

The landing demo is public and stateless on our side: the profile is built in the
browser and sent back with each call. We persist nothing but the IP gate.
"""
from pydantic import BaseModel, Field


class DemoExtractLatexRequest(BaseModel):
    # max_length guards token spend on the public endpoint.
    code: str = Field(..., min_length=1, max_length=60_000, description="Pasted LaTeX source.")


class DemoProfileResponse(BaseModel):
    profile: dict = Field(..., description="Extracted profile JSON (browser-held, not saved).")


class DemoGenerateRequest(BaseModel):
    profile: dict = Field(..., description="Browser-held profile to tailor.")
    jd: str = Field(..., min_length=1, max_length=20_000, description="Job description text.")
    template: str | None = Field(default=None, description="Optional LaTeX template (from a paste).")


class DemoStatusResponse(BaseModel):
    used: bool = Field(..., description="True if this IP already spent its free demo.")
