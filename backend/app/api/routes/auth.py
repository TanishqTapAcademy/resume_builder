"""Auth routes (BACKEND.md §0 rule 1: thin router).

POST /auth/signup -> create account, return JWT + user.
POST /auth/login  -> verify credentials, return JWT + user.
GET  /auth/me     -> who am I (the frontend's on-load logged-in check).

All logic lives in auth_service; this layer only maps HTTP <-> service.
"""
from fastapi import APIRouter, Depends, HTTPException

from app.api.deps import get_current_user
from app.models.auth import AuthResponse, LoginRequest, SignupRequest, UserOut
from app.services.auth_service import AuthError, login, signup

router = APIRouter(prefix="/auth", tags=["auth"])

# AuthError.code -> HTTP status.
_STATUS = {"exists": 409, "invalid": 401, "token": 401}


@router.post("/signup", response_model=AuthResponse, status_code=201)
async def signup_endpoint(request: SignupRequest) -> AuthResponse:
    """Create a new account and return a session token."""
    try:
        token, user = await signup(request.email, request.password)
    except AuthError as exc:
        raise HTTPException(status_code=_STATUS.get(exc.code, 400), detail=exc.message)
    return AuthResponse(token=token, user=UserOut(**user))


@router.post("/login", response_model=AuthResponse)
async def login_endpoint(request: LoginRequest) -> AuthResponse:
    """Verify credentials and return a session token."""
    try:
        token, user = await login(request.email, request.password)
    except AuthError as exc:
        raise HTTPException(status_code=_STATUS.get(exc.code, 400), detail=exc.message)
    return AuthResponse(token=token, user=UserOut(**user))


@router.get("/me", response_model=UserOut)
async def me_endpoint(user: dict = Depends(get_current_user)) -> UserOut:
    """Return the current user — used by the frontend to decide landing vs dashboard."""
    return UserOut(**user)
