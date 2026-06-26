"""Profile store service (LLM.md §1) — load, save, derive the fact set.

The profile is the ONLY allowed source of facts for generation. It is stored and
served as **freeform JSON**: whatever shape it's in, we accept and pass it through.
The documented schema (LLM.md §1) is a *guideline* — a target for generation and
PDF-parsing — NOT a hard gate. Nothing here rejects a profile for changing shape.

HTTP-agnostic (BACKEND.md §0 rule 1). The fact-set reader is defensive: missing or
differently-shaped fields degrade gracefully, they don't crash.
"""
import json
from pathlib import Path

from app.core.config import get_settings


class ProfileNotFoundError(Exception):
    """Raised when the profile store file does not exist."""


def _profile_path() -> Path:
    return Path(get_settings().profile_path)


def load_profile() -> dict:
    """Read the stored profile as raw JSON (a plain dict).

    Raises:
        ProfileNotFoundError: the store file is missing.
    """
    path = _profile_path()
    if not path.exists():
        raise ProfileNotFoundError(f"Profile store not found at '{path}'.")
    return json.loads(path.read_text(encoding="utf-8"))


def save_profile(profile: dict) -> dict:
    """Write the profile JSON to disk as-is; return it. No shape enforced."""
    _profile_path().write_text(
        json.dumps(profile, indent=2, ensure_ascii=False), encoding="utf-8"
    )
    return profile


def get_fact_set(profile: dict | None = None) -> dict:
    """Flatten the profile into the fact set for the anti-fabrication check (LLM.md §3).

    Returns:
        {
          "skills": [...every declared skill + every project tech...],  # exact-match
          "claims": [...summary + every experience/project highlight...],  # prose judge
        }

    Reads defensively (.get with fallbacks, type checks) so a reshaped or partial
    profile never raises here. Project tech counts as allowed skills too, so a
    generated resume citing e.g. "OpenRouter" isn't falsely flagged as fabricated.
    """
    profile = profile if profile is not None else load_profile()

    declared: list[str] = []
    skills = profile.get("skills")
    if isinstance(skills, dict):
        for group in skills.values():
            if isinstance(group, list):
                declared.extend(str(s) for s in group)
    elif isinstance(skills, list):
        declared.extend(str(s) for s in skills)

    projects = profile.get("projects") or []
    tech = [
        str(t)
        for proj in projects
        if isinstance(proj, dict)
        for t in (proj.get("tech") or [])
    ]
    all_skills = sorted(set(declared + tech))

    claims: list[str] = []
    summary = profile.get("summary")
    if isinstance(summary, str) and summary:
        claims.append(summary)
    for exp in profile.get("experience") or []:
        if isinstance(exp, dict):
            claims.extend(str(h) for h in (exp.get("highlights") or []))
    for proj in projects:
        if isinstance(proj, dict):
            claims.extend(str(h) for h in (proj.get("highlights") or []))

    return {"skills": all_skills, "claims": claims}
