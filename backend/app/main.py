"""FastAPI application entry point.

Responsibilities (BACKEND.md §2): create the app, add CORS, include routers.
No business logic lives here — routers delegate to services.
"""
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.routes import auth, compile, demo, generate, health, match, profile
from app.core.config import get_settings
from app.db.database import close_db, init_db

settings = get_settings()


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Open the DB pool (and apply the schema) on startup; close it on shutdown."""
    await init_db()
    yield
    await close_db()


app = FastAPI(
    title="Resume Builder API",
    description="Receives LaTeX code, runs pdflatex, returns a PDF.",
    version="0.1.0",
    lifespan=lifespan,
)

# CORS: allow the React frontend (origins from config) to call this API.
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["X-Resume-Warning"],  # let the browser read /generate warnings
)

# Routers
app.include_router(health.router)
app.include_router(auth.router)
app.include_router(compile.router)
app.include_router(profile.router)
app.include_router(match.router)
app.include_router(generate.router)
app.include_router(demo.router)
