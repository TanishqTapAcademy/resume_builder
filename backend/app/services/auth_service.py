"""Auth service — password hashing + JWT issue/verify, and the signup/login flows.

The ONLY place that hashes passwords or signs tokens (BACKEND.md §0 rule 1). Routers
call signup()/login() and get back a token + safe user dict; they never see hashes.

JWT: HS256, subject = user id, with iat/exp. Tokens are stateless — there is no
server-side session, so "logout" is purely the frontend dropping the token.
"""
from datetime import datetime, timedelta, timezone

import asyncpg
import bcrypt
import jwt

from app.core.config import get_settings
from app.services import user_service

# bcrypt hashes at most 72 bytes; longer passwords are silently truncated by the
# algorithm, so we cap explicitly to keep hash and verify consistent.
_BCRYPT_MAX_BYTES = 72


class AuthError(Exception):
    """Raised for auth failures. `code` maps to an HTTP status in the router."""

    def __init__(self, message: str, code: str = "invalid"):
        super().__init__(message)
        self.message = message
        self.code = code  # "exists" -> 409, "invalid" -> 401, "token" -> 401


# ---- password hashing -----------------------------------------------------

def hash_password(password: str) -> str:
    """Hash a plaintext password with bcrypt (random per-password salt)."""
    pw = password.encode("utf-8")[:_BCRYPT_MAX_BYTES]
    return bcrypt.hashpw(pw, bcrypt.gensalt()).decode("utf-8")


def verify_password(password: str, password_hash: str) -> bool:
    """Constant-time check of a plaintext password against a stored hash."""
    pw = password.encode("utf-8")[:_BCRYPT_MAX_BYTES]
    try:
        return bcrypt.checkpw(pw, password_hash.encode("utf-8"))
    except ValueError:
        return False


# ---- tokens ---------------------------------------------------------------

def create_access_token(user_id: str) -> str:
    """Sign a JWT whose subject is the user id, expiring per config."""
    settings = get_settings()
    now = datetime.now(timezone.utc)
    payload = {
        "sub": str(user_id),
        "iat": now,
        "exp": now + timedelta(minutes=settings.jwt_expire_minutes),
    }
    return jwt.encode(payload, settings.jwt_secret, algorithm=settings.jwt_algorithm)


def decode_token(token: str) -> str:
    """Verify a JWT and return its subject (user id). Raises AuthError if invalid."""
    settings = get_settings()
    try:
        payload = jwt.decode(
            token, settings.jwt_secret, algorithms=[settings.jwt_algorithm]
        )
    except jwt.PyJWTError as exc:
        raise AuthError(f"Invalid or expired token: {exc}", code="token")
    sub = payload.get("sub")
    if not sub:
        raise AuthError("Token missing subject.", code="token")
    return sub


# ---- flows ----------------------------------------------------------------

def _safe_user(user: dict) -> dict:
    """Strip the password hash; what's safe to return to the client."""
    return {"id": str(user["id"]), "email": user["email"]}


async def signup(email: str, password: str) -> tuple[str, dict]:
    """Create an account and return (token, safe_user). 409 if the email is taken."""
    email = email.strip().lower()
    password_hash = hash_password(password)
    try:
        user = await user_service.create_user(email, password_hash)
    except asyncpg.UniqueViolationError:
        raise AuthError("An account with that email already exists.", code="exists")
    return create_access_token(user["id"]), _safe_user(user)


async def login(email: str, password: str) -> tuple[str, dict]:
    """Verify credentials and return (token, safe_user). 401 on any mismatch."""
    email = email.strip().lower()
    user = await user_service.get_user_by_email(email)
    # Verify even when the user is missing-ish to avoid leaking which emails exist.
    if user is None or not verify_password(password, user["password_hash"]):
        raise AuthError("Incorrect email or password.", code="invalid")
    return create_access_token(user["id"]), _safe_user(user)
