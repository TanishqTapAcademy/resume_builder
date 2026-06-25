"""Filesystem helpers (BACKEND.md §0 rule 7: isolated, cleaned-up temp dirs).

Dumb and reusable — no knowledge of LaTeX or HTTP. The service decides when
to use these; utils just do the mechanics.
"""
import shutil
import tempfile
from contextlib import contextmanager
from pathlib import Path
from typing import Iterator


@contextmanager
def temp_workdir(prefix: str = "resume_") -> Iterator[Path]:
    """Create an isolated temp directory, yield it, and always remove it after.

    Usage:
        with temp_workdir() as work:
            (work / "resume.tex").write_text(code)
            ...
    The directory (and everything in it) is deleted on exit, success or failure.
    """
    path = Path(tempfile.mkdtemp(prefix=prefix))
    try:
        yield path
    finally:
        shutil.rmtree(path, ignore_errors=True)


def write_text(path: Path, content: str) -> Path:
    """Write text to a file (UTF-8) and return the path."""
    path.write_text(content, encoding="utf-8")
    return path
