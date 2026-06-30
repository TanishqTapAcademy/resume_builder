"""Deterministic edit application for the generation repair loop (LLM.md §4).

An edit is {find, replace}. We apply it ONLY if `find` occurs exactly once, so a
model-produced edit can never silently corrupt the document: it either lands on a
unique anchor, or is reported as a failure for the caller to fall back on (full
regenerate). This is the safety net behind edit-mode repair.
"""
from typing import Iterable


def apply_edits(tex: str, edits: Iterable[dict]) -> tuple[str, list[dict]]:
    """Apply find/replace edits to `tex`.

    Returns (new_tex, failures). `replace` == "" deletes. By default an edit fails (and is
    skipped) if its `find` is empty or does not occur EXACTLY once — the safety net that
    stops a model edit from silently corrupting the document.

    An edit may set `"all": True` to deliberately replace EVERY occurrence — needed for
    values that legitimately recur, e.g. an email or URL rendered in both an \\href target
    and its visible label. With `all`, the only failure is zero occurrences.
    """
    result = tex
    failures: list[dict] = []
    for edit in edits:
        find = edit.get("find", "")
        replace = edit.get("replace", "")
        replace_all = bool(edit.get("all"))
        if not find:
            failures.append({**edit, "occurrences": 0})
            continue
        count = result.count(find)
        if count == 1 or (replace_all and count >= 1):
            result = result.replace(find, replace)  # str.replace already changes all matches
        else:
            failures.append({**edit, "occurrences": count})
    return result, failures
