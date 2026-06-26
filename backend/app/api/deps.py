"""Shared FastAPI dependencies — the current-user guard for protected routes.

`get_current_user` reads the `Authorization: Bearer <jwt>` header, verifies the token,
resolves the user, and returns a safe dict {id, email}. Any failure -> 401. Protected
routers add `user = Depends(get_current_user)` and trust `user["id"]` as the owner.
"""
from fastapi import Depends, HTTPException
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from app.services import user_service
from app.services.auth_service import AuthError, decode_token

# auto_error=False so a missing header yields our own clean 401, not FastAPI's 403.
_bearer = HTTPBearer(auto_error=False)


async def get_current_user(
    creds: HTTPAuthorizationCredentials | None = Depends(_bearer),
) -> dict:
    """Resolve and return the authenticated user, or raise 401."""
    if creds is None:
        raise HTTPException(status_code=401, detail="Not authenticated.")
    try:
        user_id = decode_token(creds.credentials)
    except AuthError as exc:
        raise HTTPException(status_code=401, detail=exc.message)

    user = await user_service.get_user_by_id(user_id)
    if user is None:
        raise HTTPException(status_code=401, detail="User no longer exists.")
    return {"id": str(user["id"]), "email": user["email"]}
