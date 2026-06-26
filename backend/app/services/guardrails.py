"""Guardrails (LLM.md §3, §4) — generation safety checks as standalone functions.

Three independent guarantees the verify-&-repair loop (Step 5) will call:
  - ats_sanitize(tex)       : deterministic ATS cleanup (always runs, never "retries")
  - count_pages(pdf)        : page count for the one-page check
  - check_facts(tex, facts) : grounded fact-check — flags anything not in the profile

HTTP-agnostic (BACKEND.md §0 rule 1).
"""
import json
from io import BytesIO

from pypdf import PdfReader

from app.core.config import get_settings
from app.services.ai_client import structured_json

# --- 1. ATS sanitizer (deterministic) --------------------------------------

# Typographic "AI tells" / ATS-unfriendly characters -> plain ASCII equivalents.
_CHAR_REPLACEMENTS = {
    "—": "-",    # em dash  —
    "–": "-",    # en dash  –
    "−": "-",    # minus sign −
    "“": '"',    # left double curly quote
    "”": '"',    # right double curly quote
    "‘": "'",    # left single curly quote
    "’": "'",    # right single curly quote / apostrophe
    "…": "...",  # ellipsis …
    " ": " ",    # non-breaking space
    "​": "",     # zero-width space
}


def ats_sanitize(tex: str) -> str:
    """Replace AI/ATS-unfriendly typography with plain ASCII.

    Deterministic and always safe to run. Scope: typographic tells only (dashes,
    smart quotes, ellipsis, exotic spaces). Phrase-level tells are out of scope —
    those are the generator's job, not a blind find-replace over resume content.
    """
    for bad, good in _CHAR_REPLACEMENTS.items():
        tex = tex.replace(bad, good)
    tex = tex.replace("---", "-")  # LaTeX em-dash sequence -> hyphen
    return tex


# --- 2. Page count ---------------------------------------------------------

def count_pages(pdf_bytes: bytes) -> int:
    """Return the number of pages in a compiled PDF (for the one-page guardrail)."""
    return len(PdfReader(BytesIO(pdf_bytes)).pages)


# --- 3. Grounded fact-check (LLM-judge) ------------------------------------

_FACTCHECK_SYSTEM = """You are a strict resume fact-checker enforcing zero fabrication.

You are given:
  - PROFILE: the candidate's COMPLETE data as JSON. EVERY value in it is an allowed
    fact — skills, summary, employers, job titles, employment dates, locations, project
    names, project tech, education, degrees, CGPA, and every highlight sentence.
  - RESUME: a generated LaTeX resume.

Flag every claim in the RESUME that cannot be traced to ANY field of the PROFILE:
invented skills/technologies, employers, titles, dates, degrees, or quantified metrics
that appear NOWHERE in the profile.

Rules:
  - Paraphrasing, rewording, reordering, and emphasis ARE allowed (same fact, different
    words = supported). Only genuinely NEW facts are violations.
  - RE-POSITIONING is allowed, NOT a violation: describing a candidate whose profile
    shows LLM/RAG/agentic work as a "GenAI / LLM Engineer" in the summary is framing
    supported by the body of work, not a new fact. Only flag CONCRETE new facts.
  - A skill/technology mentioned anywhere in the profile (skills lists, project tech, OR
    highlight sentences) is allowed.
  - A skill/technology present NOWHERE in the profile is a violation (e.g. "Kotlin").
  - A number/metric not in the profile is a violation.
  - Ignore LaTeX commands, formatting, and section titles — judge only factual content.
  - If everything is supported, return an empty list.

For each violation return the exact offending claim text and a short reason."""

_FACTCHECK_SCHEMA = {
    "type": "object",
    "properties": {
        "violations": {
            "type": "array",
            "items": {
                "type": "object",
                "properties": {
                    "claim": {"type": "string"},
                    "reason": {"type": "string"},
                },
                "required": ["claim", "reason"],
                "additionalProperties": False,
            },
        }
    },
    "required": ["violations"],
    "additionalProperties": False,
}


async def check_facts(tex: str, profile: dict) -> dict:
    """Flag any claim in `tex` not grounded in the full `profile`. Returns {ok, violations}.

    The judge is handed the WHOLE profile JSON as the allowed-facts set (not a lossy
    extract), so real employers/titles/dates/education are recognised while genuine
    inventions (e.g. "Kotlin") are still caught. It must quote the offending claim.
    """
    settings = get_settings()
    user = (
        "=== PROFILE (the ONLY allowed facts - every field here is allowed) ===\n"
        f"{json.dumps(profile, ensure_ascii=False, indent=2)}\n\n"
        "=== RESUME (LaTeX) ===\n"
        f"{tex}"
    )
    result = await structured_json(
        what="factcheck",
        system=_FACTCHECK_SYSTEM,
        user=user,
        schema=_FACTCHECK_SCHEMA,
        model=settings.gap_model_small,
        schema_name="factcheck",
    )
    violations = result.get("violations", [])
    return {"ok": len(violations) == 0, "violations": violations}
