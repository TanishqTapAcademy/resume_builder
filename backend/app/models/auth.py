"""Auth request/response schemas (BACKEND.md §2 — validation only, no logic)."""
from pydantic import BaseModel, EmailStr, Field


class SignupRequest(BaseModel):
    """Body of POST /auth/signup."""

    email: EmailStr = Field(..., description="Account email (unique).")
    password: str = Field(..., min_length=8, max_length=128, description="Min 8 chars.")


class LoginRequest(BaseModel):
    """Body of POST /auth/login."""

    email: EmailStr
    password: str = Field(..., min_length=1)


class UserOut(BaseModel):
    """Public-safe user view (never includes the password hash)."""

    id: str
    email: EmailStr


class AuthResponse(BaseModel):
    """Returned by signup/login: the JWT plus the user it belongs to."""

    token: str
    user: UserOut
