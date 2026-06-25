"""The heart of the app (BACKEND.md §3): LaTeX code -> PDF bytes.

Pure and HTTP-agnostic: takes a string, returns bytes, raises on failure.
Callable from a test, a CLI, or a route with zero FastAPI imports.
"""
import subprocess
from pathlib import Path

from app.core.config import get_settings
from app.utils.errors import (
    CompileTimeoutError,
    LatexCompileError,
    extract_error_snippet,
)
from app.utils.files import temp_workdir, write_text

TEX_FILENAME = "resume.tex"
PDF_FILENAME = "resume.pdf"


def _engine_command(engine: str) -> str:
    """Resolve the engine binary path.

    pdflatex uses the configured full path; sibling engines (xelatex/lualatex)
    are resolved from the same bin directory so future support needs no rewrite.
    """
    settings = get_settings()
    if engine == "pdflatex":
        return settings.pdflatex_path
    return str(Path(settings.pdflatex_path).with_name(engine))


def compile_latex(code: str, *, engine: str = "pdflatex") -> bytes:
    """Compile LaTeX source into a PDF and return its bytes.

    Raises:
        LatexCompileError: input too large, or LaTeX failed (carries log snippet).
        CompileTimeoutError: compile exceeded the configured timeout.
    """
    settings = get_settings()

    if len(code.encode("utf-8")) > settings.max_code_bytes:
        raise LatexCompileError(
            f"Source too large (limit {settings.max_code_bytes} bytes)."
        )

    with temp_workdir() as work:
        write_text(work / TEX_FILENAME, code)

        cmd = [
            _engine_command(engine),
            "-interaction=nonstopmode",  # don't stop for prompts
            "-halt-on-error",            # fail fast on the first error
            "-no-shell-escape",          # SECURITY: block \write18 shell execution
            TEX_FILENAME,
        ]

        try:
            result = subprocess.run(
                cmd,
                cwd=work,
                capture_output=True,
                text=True,
                timeout=settings.compile_timeout,
            )
        except subprocess.TimeoutExpired:
            raise CompileTimeoutError(
                f"Compile exceeded {settings.compile_timeout}s timeout."
            )
        except FileNotFoundError:
            raise LatexCompileError(
                f"LaTeX engine not found at '{_engine_command(engine)}'. "
                "Check PDFLATEX_PATH in config."
            )

        pdf_path = work / PDF_FILENAME
        if result.returncode != 0 or not pdf_path.exists():
            raise LatexCompileError(
                "LaTeX compilation failed.",
                log=extract_error_snippet(result.stdout + "\n" + result.stderr),
            )

        return pdf_path.read_bytes()
