"""FastAPI application entry point.

Responsibilities (BACKEND.md §2): create the app, add CORS, include routers.
No business logic lives here — routers delegate to services.
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.routes import compile, health
from app.core.config import get_settings

settings = get_settings()

app = FastAPI(
    title="Resume Builder API",
    description="Receives LaTeX code, runs pdflatex, returns a PDF.",
    version="0.1.0",
)

# CORS: allow the React frontend (origins from config) to call this API.
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Routers
app.include_router(health.router)
app.include_router(compile.router)
