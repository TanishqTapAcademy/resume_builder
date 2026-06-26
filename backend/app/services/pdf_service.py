"""PDF text extraction for profile seeding (the "upload your resume" door).

Uses PyMuPDF (fitz) — the best free option for both text and embedded hyperlinks, so
links hidden behind text (LinkedIn/GitHub) are recovered too. We deliberately keep this
dumb: pull raw text + link URLs and hand the whole dump to the AI extractor, which does
the structuring. No hand-rolled parsing rules.

HTTP-agnostic (BACKEND.md §0 rule 1).
"""
import fitz  # PyMuPDF


class PdfParseError(Exception):
    """Raised when the uploaded bytes can't be opened/read as a PDF."""


def extract_text(pdf_bytes: bytes) -> str:
    """Return the resume's raw text plus any embedded hyperlink URLs, page by page."""
    try:
        doc = fitz.open(stream=pdf_bytes, filetype="pdf")
    except Exception as exc:  # fitz raises various low-level errors
        raise PdfParseError(f"Could not read the PDF: {exc}")

    parts: list[str] = []
    links: set[str] = set()
    try:
        for page in doc:
            parts.append(page.get_text("text"))
            for link in page.get_links():
                uri = link.get("uri")
                if uri:
                    links.add(uri)
    finally:
        doc.close()

    text = "\n".join(parts).strip()
    if links:
        text += "\n\nEMBEDDED LINKS:\n" + "\n".join(sorted(links))
    if not text:
        raise PdfParseError("No extractable text found in the PDF.")
    return text
