"""Application configuration (BACKEND.md §4 — no magic values in logic).

All environment-specific values live here, sourced from env vars with sane
dev defaults so the app runs out-of-the-box on this Mac. In Docker/prod, these
are overridden via environment variables (see DEPLOYMENT.md).
"""
from functools import lru_cache
from pathlib import Path

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

    # --- AI layer (see LLM.md) ---------------------------------------------
    # OpenAI API key. Server-side ONLY — never sent to the frontend, never
    # committed. Empty default so the app still boots without AI configured;
    # AI endpoints fail clearly until this is set in .env.
    openai_api_key: str = ""

    # Model names per tier (LLM.md §2). Names live here, never in logic.
    gen_model: str = "gpt-5"        # flagship: full resume generation + self-repair

    # Match tier picks a model by input size (LLM.md §5): small/easy inputs use the
    # fast mini; large inputs use the full model for better long-context accuracy.
    gap_model_small: str = "gpt-4.1-mini"
    gap_model_large: str = "gpt-4.1"
    gap_token_threshold: int = 6000   # est. input tokens; above this -> large model
                                      # (revisited properly in the RAG phase — LLM.md §7)
    chars_per_token: int = 4          # rough token estimate: len(text) // this

    # Path to the structured profile store — the single source of truth (LLM.md §1).
    # Package-relative default (app/data/profile.json); override via env if needed.
    profile_path: str = str(Path(__file__).resolve().parent.parent / "data" / "profile.json")

    # Match gate threshold (percent). >= unlocks generation; < advises only.
    match_threshold: int = 70

    # Verify & repair loop caps (LLM.md §4).
    max_repair_retries: int = 2     # per-check retries (compile / one-page)
    max_total_model_calls: int = 6  # hard ceiling on model calls per /generate

    # ai_client resilience — network-retry tunables (distinct from the repair retries).
    ai_max_retries: int = 3            # attempts per model on transient errors
    ai_backoff_base: float = 0.5       # seconds; exponential: base * 2**(attempt-1)
    fallback_model: str = "gpt-4o-mini"  # tried if a tier's primary model keeps failing
    match_temperature: float = 0.0     # low -> stable match score (LLM.md §5)


@lru_cache
def get_settings() -> Settings:
    """Cached settings singleton — import this, don't instantiate Settings directly."""
    return Settings()
