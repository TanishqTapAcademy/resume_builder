"""Profile request/response schemas (BACKEND.md §2 — validation only, no logic)."""
from pydantic import BaseModel, Field


class ProfileResponse(BaseModel):
    """The user's profile as returned to the frontend."""

    data: dict = Field(..., description="Freeform profile JSON (any shape).")
    source: str = Field(..., description="How it was seeded: latex | pdf | manual.")
    hasTemplate: bool = Field(..., description="True if a LaTeX template is stored.")


class SeedLatexRequest(BaseModel):
    """Body of POST /profile/seed/latex — the pasted Overleaf/LaTeX source."""

    code: str = Field(..., min_length=1, description="Full LaTeX resume source.")


class ChatTurn(BaseModel):
    """One session-only conversation turn, supplied by the frontend."""

    role: str = Field(..., description="'user' or 'assistant'.")
    content: str = Field(default="")


class ChatRequest(BaseModel):
    """Body of POST /profile/chat. The profile + conversation come from the frontend."""

    profile: dict = Field(..., description="Current profile JSON (may be unsaved edits).")
    message: str = Field(..., min_length=1, description="The user's latest message.")
    history: list[ChatTurn] = Field(default_factory=list, description="Recent turns (context).")


class ChatResponse(BaseModel):
    """Assistant reply + a proposed partial patch (changed top-level keys only)."""

    reply: str = Field(..., description="Short assistant message.")
    changes: dict | None = Field(None, description="Changed top-level sections, or null.")
    remaining: int = Field(..., description="Chat messages left today.")
