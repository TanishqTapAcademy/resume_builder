"""Profile AI (gpt-4.1) — two jobs, both through the single ai_client door:

  1. extract_profile(raw_text): raw resume text OR LaTeX -> structured profile JSON.
     One easy call, fixed schema, no hand parsing. Same path for PDF and Overleaf.

  2. chat_edit(profile, message, history): conversational profile editor. Returns a
     short reply plus ONLY the changed top-level sections (a patch), never the whole
     profile. The conversation is session-only (passed in from the frontend, never stored).

HTTP-agnostic (BACKEND.md §0 rule 1).
"""
import json
import logging

from app.core.config import get_settings
from app.services.ai_client import structured_json

logger = logging.getLogger("profile_ai")

# ---- 1. Extraction --------------------------------------------------------

_EXTRACT_SYSTEM = """You convert a candidate's resume (plain text or LaTeX source) into a \
structured JSON profile. This profile becomes the candidate's single source of truth.

Rules:
- Extract ONLY what is present. Never invent skills, employers, dates, metrics, or links.
- If a field is unknown, use an empty string "" or an empty list [] — do not guess.
- Preserve real wording for highlight/bullet sentences; don't embellish.
- Group skills into sensible categories (e.g. Languages, Backend, AI/ML) using the
  resume's own grouping when it has one.
- Ignore LaTeX commands/formatting; extract the underlying facts."""

# Fixed, strict-output-friendly shape. Renders cleanly and stays consistent across runs.
_PROFILE_SCHEMA = {
    "type": "object",
    "properties": {
        "contact": {
            "type": "object",
            "properties": {
                "name": {"type": "string"},
                "email": {"type": "string"},
                "phone": {"type": "string"},
                "location": {"type": "string"},
                "linkedin": {"type": "string"},
                "github": {"type": "string"},
                "website": {"type": "string"},
            },
            "required": ["name", "email", "phone", "location", "linkedin", "github", "website"],
            "additionalProperties": False,
        },
        "summary": {"type": "string"},
        "experience": {
            "type": "array",
            "items": {
                "type": "object",
                "properties": {
                    "company": {"type": "string"},
                    "title": {"type": "string"},
                    "location": {"type": "string"},
                    "start": {"type": "string"},
                    "end": {"type": "string"},
                    "highlights": {"type": "array", "items": {"type": "string"}},
                },
                "required": ["company", "title", "location", "start", "end", "highlights"],
                "additionalProperties": False,
            },
        },
        "skills": {
            "type": "array",
            "items": {
                "type": "object",
                "properties": {
                    "category": {"type": "string"},
                    "items": {"type": "array", "items": {"type": "string"}},
                },
                "required": ["category", "items"],
                "additionalProperties": False,
            },
        },
        "projects": {
            "type": "array",
            "items": {
                "type": "object",
                "properties": {
                    "name": {"type": "string"},
                    "tech": {"type": "array", "items": {"type": "string"}},
                    "date": {"type": "string"},
                    "highlights": {"type": "array", "items": {"type": "string"}},
                },
                "required": ["name", "tech", "date", "highlights"],
                "additionalProperties": False,
            },
        },
        "education": {
            "type": "array",
            "items": {
                "type": "object",
                "properties": {
                    "institution": {"type": "string"},
                    "degree": {"type": "string"},
                    "location": {"type": "string"},
                    "start": {"type": "string"},
                    "end": {"type": "string"},
                    "cgpa": {"type": "string"},
                },
                "required": ["institution", "degree", "location", "start", "end", "cgpa"],
                "additionalProperties": False,
            },
        },
        "other": {"type": "array", "items": {"type": "string"}},
    },
    "required": ["contact", "summary", "experience", "skills", "projects", "education", "other"],
    "additionalProperties": False,
}


async def extract_profile(raw_text: str) -> dict:
    """Turn raw resume text/LaTeX into a structured profile dict (gpt-4.1)."""
    settings = get_settings()
    result = await structured_json(
        what="profile_extract",
        system=_EXTRACT_SYSTEM,
        user=f"=== RESUME SOURCE ===\n{raw_text}",
        schema=_PROFILE_SCHEMA,
        model=settings.gap_model_large,  # gpt-4.1
        schema_name="profile",
    )
    return result


# ---- 2. Conversational editor ---------------------------------------------

_CHAT_SYSTEM = """You are a profile-editing assistant. You help the user refine their \
resume profile (a JSON object) through conversation.

You are given the user's CURRENT profile JSON and their latest message (plus recent
conversation for context). Decide what, if anything, to change.

Return TWO things:
- "reply": a short, friendly message. If you're changing the profile, say plainly what
  you'll change (e.g. "Added Docker to your Backend skills."). If it's a question or no
  change is needed, just answer.
- "changes_json": a JSON OBJECT, encoded as a string, containing ONLY the top-level
  profile keys you are changing, each with its COMPLETE new value. Return "" (empty
  string) when there is nothing to change.

Rules:
- NEVER fabricate. Only use facts the user gives you or that already exist in the profile.
- Output ONLY changed top-level sections — never echo the entire profile.
- When editing inside a section (e.g. adding one skill), return that whole section's new
  value so it can replace the old one cleanly.
- Keep the same shape/keys the profile already uses."""

_CHAT_SCHEMA = {
    "type": "object",
    "properties": {
        "reply": {"type": "string"},
        # A JSON object (as a string) of changed top-level keys, or "" for no change.
        "changes_json": {"type": "string"},
    },
    "required": ["reply", "changes_json"],
    "additionalProperties": False,
}


def _history_block(history: list[dict]) -> str:
    """Render recent {role, content} turns (frontend-provided) as context."""
    if not history:
        return "(no prior messages)"
    lines = []
    for turn in history[-8:]:  # cap context; conversation is session-only anyway
        role = turn.get("role", "user")
        content = turn.get("content", "")
        lines.append(f"{role.upper()}: {content}")
    return "\n".join(lines)


async def chat_edit(profile: dict, message: str, history: list[dict]) -> dict:
    """Return {reply, changes} where `changes` is a partial top-level patch (or None)."""
    settings = get_settings()
    user = (
        "=== CURRENT PROFILE (JSON) ===\n"
        f"{json.dumps(profile, ensure_ascii=False, indent=2)}\n\n"
        "=== RECENT CONVERSATION ===\n"
        f"{_history_block(history)}\n\n"
        "=== USER MESSAGE ===\n"
        f"{message}"
    )
    result = await structured_json(
        what="profile_chat",
        system=_CHAT_SYSTEM,
        user=user,
        schema=_CHAT_SCHEMA,
        model=settings.gap_model_large,  # gpt-4.1
        schema_name="profile_chat",
    )

    reply = result.get("reply", "")
    changes = None
    raw = (result.get("changes_json") or "").strip()
    if raw:
        try:
            parsed = json.loads(raw)
            if isinstance(parsed, dict) and parsed:
                changes = parsed
        except json.JSONDecodeError:
            logger.warning("chat_edit: model returned invalid changes_json; ignoring")
    return {"reply": reply, "changes": changes}
