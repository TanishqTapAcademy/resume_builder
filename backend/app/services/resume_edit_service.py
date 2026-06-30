"""Post-generation, section-scoped chat editor (the fast edit path).

Once a resume exists, users want to tweak small things ("punch up the summary", "shorten
the first bullet") without regenerating the whole document. Doing that cheaply is the whole
point of this module:

  1. Split the LaTeX into its `\\section{...}` blocks (+ the contact/header block).
  2. Auto-detect which ONE block the instruction targets (a tiny, cheap classify call).
  3. Send ONLY that block (plus the matching slice of the profile + a JD excerpt) to a fast
     model, which returns a MINIMAL find/replace edit list — not a new document.
  4. Apply the edits to the FULL doc on unique anchors, re-sanitize, recompile, and check it
     still fits one page.

Sending one section instead of the entire resume is what keeps this fast and token-light.
We deliberately SKIP the heavy fact-grounding re-check here (LLM.md fast-edit path) — the
edit prompt is told never to fabricate, and the user is reviewing every change live.

HTTP-agnostic (BACKEND.md §0 rule 1).
"""
import json
import logging
import re

from app.core.config import get_settings
from app.services.ai_client import structured_json
from app.services.guardrails import ats_sanitize, count_pages
from app.services.latex_service import compile_latex_async
from app.utils.analytics import request_metrics
from app.utils.edits import apply_edits
from app.utils.errors import LatexCompileError

logger = logging.getLogger("resume_edit")

_SECTION_RE = re.compile(r"\\section\*?\s*\{([^}]*)\}")
_BEGIN_DOC = r"\begin{document}"
_END_DOC = r"\end{document}"
_CONTACT = "Contact / Header"

# Map a detected section label -> the profile keys whose facts are relevant, so we ship the
# model only the slice it needs (more token savings). Unknown labels fall back to the whole
# profile so grounding is never starved.
_PROFILE_KEYS = {
    "professional summary": ["summary"],
    "summary": ["summary"],
    "experience": ["experience"],
    "work experience": ["experience"],
    "skills": ["skills"],
    "technical skills": ["skills"],
    "education": ["education"],
    "projects": ["projects"],
    _CONTACT.lower(): ["contact"],
}

_EDIT_SYSTEM = """You revise ONE section of an existing LaTeX resume by returning a MINIMAL
list of edits, NOT a new section.

Each edit:
  - "find": an EXACT substring of the SECTION below, copied verbatim (every brace and
    backslash), long and specific enough to occur EXACTLY ONCE.
  - "replace": the replacement text ("" to delete).

Rules:
- Do ONLY what the instruction asks. Change nothing else.
- Use ONLY facts from the PROFILE. Never invent a skill, tool, employer, date, title, or
  number that isn't in the profile.
- Keep it compilable and ATS-safe: plain ASCII only (no smart quotes, no em-dashes).
- Make the SMALLEST set of edits that satisfies the instruction.

Return JSON: { "edits": [ { "find": "...", "replace": "..." } ] }."""

_EDITS_SCHEMA = {
    "type": "object",
    "properties": {
        "edits": {
            "type": "array",
            "items": {
                "type": "object",
                "properties": {"find": {"type": "string"}, "replace": {"type": "string"}},
                "required": ["find", "replace"],
                "additionalProperties": False,
            },
        }
    },
    "required": ["edits"],
    "additionalProperties": False,
}


# ---- section parsing ------------------------------------------------------

def split_sections(tex: str) -> tuple[str, list[tuple[str, str]]]:
    """Return (header, [(title, block_text), ...]).

    `header` is everything before the first \\section (preamble + contact block). Each block
    runs from its \\section marker to the next one (or end of document).
    """
    matches = list(_SECTION_RE.finditer(tex))
    if not matches:
        return tex, []
    header = tex[: matches[0].start()]
    sections: list[tuple[str, str]] = []
    for i, m in enumerate(matches):
        start = m.start()
        end = matches[i + 1].start() if i + 1 < len(matches) else len(tex)
        sections.append((m.group(1).strip(), tex[start:end]))
    return header, sections


def _contact_block(tex: str) -> str:
    """The visible header: from \\begin{document} up to the first \\section."""
    b = tex.find(_BEGIN_DOC)
    if b == -1:
        return tex
    start = b + len(_BEGIN_DOC)
    m = _SECTION_RE.search(tex, start)
    return tex[start : (m.start() if m else len(tex))]


def _strip_enddoc(text: str) -> str:
    idx = text.find(_END_DOC)
    return text[:idx] if idx != -1 else text


def _profile_subset(profile: dict, label: str) -> dict:
    keys = _PROFILE_KEYS.get(label.strip().lower())
    if not keys:
        return profile
    sub = {k: profile[k] for k in keys if k in profile}
    return sub or profile


# ---- model calls ----------------------------------------------------------

def _route_schema(labels: list[str]) -> dict:
    return {
        "type": "object",
        "properties": {"section": {"type": "string", "enum": labels}},
        "required": ["section"],
        "additionalProperties": False,
    }


async def _detect_target(message: str, labels: list[str]) -> str:
    """Cheap classify: which section does this instruction edit? Returns a label."""
    settings = get_settings()
    res = await structured_json(
        what="edit_route",
        system=(
            "You route a resume-edit instruction to the ONE section it changes. "
            "Choose the single best-matching section label from the list."
        ),
        user=f"SECTIONS: {labels}\n\nINSTRUCTION: {message}\n\nWhich section does this edit target?",
        schema=_route_schema(labels),
        model=settings.gap_model_small,
        schema_name="route",
    )
    return res.get("section") or labels[0]


def _edit_user(section_text: str, message: str, jd: str, profile_subset: dict) -> str:
    jd_excerpt = (jd or "").strip()[:1500]
    return (
        f"INSTRUCTION (what to change): {message}\n\n"
        "=== SECTION TO EDIT (edit only within this) ===\n"
        f"{section_text}\n\n"
        "=== PROFILE FACTS (only allowed facts; invent nothing) ===\n"
        f"{json.dumps(profile_subset, ensure_ascii=False, indent=2)}\n\n"
        "=== TARGET JOB (for relevance only; never copy verbatim) ===\n"
        f"{jd_excerpt}"
    )


async def _scoped_edit(section_text: str, message: str, jd: str, profile_subset: dict) -> list[dict]:
    settings = get_settings()
    res = await structured_json(
        what="resume_edit",
        system=_EDIT_SYSTEM,
        user=_edit_user(section_text, message, jd, profile_subset),
        schema=_EDITS_SCHEMA,
        model=settings.edit_model,
        schema_name="edits",
    )
    return res.get("edits", [])


# ---- orchestrator ---------------------------------------------------------

async def edit_resume(tex: str, message: str, jd: str, profile: dict) -> dict:
    """Apply one natural-language edit to `tex`, scoped to the section it targets.

    Returns a dict:
      ok    -> True if the edit landed and recompiled
      reply -> short human message for the chat
      section -> the label we edited
      tex   -> new LaTeX (unchanged on failure; caller keeps the old one)
      pdf   -> recompiled PDF bytes (only when ok)
      pages -> page count (only when ok)
      warning -> e.g. "now 2 pages" (may be "")
    Never raises for a normal failed edit — only AIClientError (model down) propagates.
    """
    with request_metrics("/resume/edit") as m:
        result = await _edit_impl(tex, message, jd, profile)
        m["section"] = result.get("section", "")
        m["edit_ok"] = result["ok"]
        return result


async def _edit_impl(tex: str, message: str, jd: str, profile: dict) -> dict:
    header, sections = split_sections(tex)
    labels: list[str] = []
    if _BEGIN_DOC in header:
        labels.append(_CONTACT)
    labels.extend(title for title, _ in sections)
    if not labels:
        labels = ["Whole document"]

    label = await _detect_target(message, labels)

    if label == _CONTACT:
        target = _contact_block(tex)
    elif label == "Whole document":
        target = tex
    else:
        target = next((txt for title, txt in sections if title == label), tex)
        target = _strip_enddoc(target)

    edits = await _scoped_edit(target, message, jd, _profile_subset(profile, label))
    new_tex, failures = apply_edits(tex, edits)

    if not edits or failures or new_tex == tex:
        logger.info("edit no-op section=%s edits=%d failures=%d", label, len(edits), len(failures))
        return {
            "ok": False,
            "section": label,
            "reply": "I couldn't apply that cleanly — try rephrasing, or be more specific "
            "about exactly what to change.",
        }

    new_tex = ats_sanitize(new_tex)
    try:
        pdf = await compile_latex_async(new_tex)
    except LatexCompileError:
        logger.info("edit broke compile section=%s", label)
        return {
            "ok": False,
            "section": label,
            "reply": "That change broke the layout, so I kept your current version. "
            "Try a smaller or clearer edit.",
        }

    pages = count_pages(pdf)
    warning = "" if pages <= 1 else f"It's now {pages} pages — you may want to trim something."
    logger.info("edit ok section=%s pages=%d", label, pages)
    return {
        "ok": True,
        "section": label,
        "tex": new_tex,
        "pdf": pdf,
        "pages": pages,
        "warning": warning,
        "reply": f"Updated the {label} section.",
    }
