"""Application configuration (BACKEND.md §4 — no magic values in logic).

All environment-specific values live here, sourced from env vars with sane
dev defaults so the app runs out-of-the-box on this Mac. In Docker/prod, these
are overridden via environment variables (see DEPLOYMENT.md).
"""
from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    # Full path to the LaTeX engine. Default = this Mac's BasicTeX install.
    # Override in Docker (Linux path differs) — keep in sync with DEVELOPMENT.md.
    pdflatex_path: str = "/usr/local/texlive/2026basic/bin/universal-darwin/pdflatex"

    # Kill a compile that runs longer than this (seconds) — guards runaway/malicious input.
    compile_timeout: int = 20

    # Reject input larger than this many bytes.
    max_code_bytes: int = 1_000_000

    # Browser origins allowed to call this API (React dev servers by default).
    cors_origins: list[str] = ["http://localhost:5173", "http://localhost:3000"]


@lru_cache
def get_settings() -> Settings:
    """Cached settings singleton — import this, don't instantiate Settings directly."""
    return Settings()
