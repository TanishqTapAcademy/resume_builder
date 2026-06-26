# The backend "food truck": Python (FastAPI) + LaTeX (pdflatex) sealed together,
# so pdflatex is always present wherever this runs (Render, etc.).
#
# Build context = the backend/ folder (Render's Root Directory points here).
FROM python:3.12-slim

# 1) Install LaTeX — Debian package names that match the Mac dev collections,
#    so the PDF comes out identical to local:
#      texlive-latex-extra       ≈ collection-latexextra
#      texlive-fonts-recommended ≈ collection-fontsrecommended
#      texlive-fonts-extra       ≈ collection-fontsextra (fontawesome5, etc.)
#    This layer is ~1 GB and slow ONLY on the first build; cached afterwards.
RUN apt-get update && apt-get install -y --no-install-recommends \
      texlive-latex-base \
      texlive-latex-recommended \
      texlive-latex-extra \
      texlive-fonts-recommended \
      texlive-fonts-extra \
      texlive-xetex \
    && rm -rf /var/lib/apt/lists/*

# 2) Python dependencies (copied first so this layer caches unless requirements change).
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# 3) App code.
COPY . .

# 4) In the container, pdflatex is on PATH (not the Mac path). Render injects the
#    rest (DATABASE_URL, OPENAI_API_KEY, JWT_SECRET, CORS_ORIGINS) at runtime.
ENV PDFLATEX_PATH=pdflatex

# 5) Render sets $PORT; bind to it on all interfaces. Falls back to 8000 locally.
CMD ["sh", "-c", "uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000}"]
