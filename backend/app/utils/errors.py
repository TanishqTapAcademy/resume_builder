"""Custom exceptions + LaTeX log parsing (BACKEND.md §0 rule 6: fail loud & clear).

These are HTTP-agnostic — the API layer maps them to status codes, not here.
"""


class LatexCompileError(Exception):
    """Raised when pdflatex fails to produce a PDF.

    Carries a short, relevant snippet of the LaTeX log so the frontend can show
    the user what went wrong (e.g. an undefined control sequence).
    """

    def __init__(self, message: str, log: str = "") -> None:
        super().__init__(message)
        self.message = message
        self.log = log


class CompileTimeoutError(LatexCompileError):
    """Raised when a compile exceeds the configured timeout."""


def extract_error_snippet(log: str, max_lines: int = 40) -> str:
    """Pull the meaningful error lines out of a noisy LaTeX log.

    LaTeX errors begin with '!'. We return the lines around the first error,
    falling back to the tail of the log if no '!' marker is found.
    """
    lines = log.splitlines()
    for i, line in enumerate(lines):
        if line.startswith("!"):
            return "\n".join(lines[i : i + max_lines]).strip()
    return "\n".join(lines[-max_lines:]).strip()
