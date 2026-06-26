"""Deterministic edit application for the generation repair loop (LLM.md §4).

An edit is {find, replace}. We apply it ONLY if `find` occurs exactly once, so a
model-produced edit can never silently corrupt the document: it either lands on a
unique anchor, or is reported as a failure for the caller to fall back on (full
regenerate). This is the safety net behind edit-mode repair.
"""
from typing import Iterable


def apply_edits(tex: str, edits: Iterable[dict]) -> tuple[str, list[dict]]:
    """Apply find/replace edits to `tex`.

    Returns (new_tex, failures). An edit fails (and is skipped) if its `find` is
    empty or does not occur exactly once in the current text. `replace` == "" deletes.
    """
    result = tex
    failures: list[dict] = []
    for edit in edits:
        find = edit.get("find", "")
        replace = edit.get("replace", "")
        if not find:
            failures.append({**edit, "occurrences": 0})
            continue
        count = result.count(find)
        if count == 1:
            result = result.replace(find, replace)
        else:
            failures.append({**edit, "occurrences": count})
    return result, failures
