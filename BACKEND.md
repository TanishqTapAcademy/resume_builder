# BACKEND — Architecture & Rules (read this BEFORE touching backend code)

> Purpose: This is the **standing contract** for the Python backend. Whenever development
> returns to the backend, read this first so we don't forget the structure, the conventions,
> or the reasons behind them. The app's one job: **receive LaTeX code → run `pdflatex` →
> return a PDF.** Everything here keeps that clean, layered, and reusable.

Stack: **FastAPI** (web framework) + **Uvicorn** (server). Python 3.9+. No Flask.

---

## 0. Golden rules (the important conditions — never break these)

1. **Thin routers, fat services.** Route functions only parse the request and call a service.
   No LaTeX logic, no file I/O, no `subprocess` inside a route. Ever.
2. **One responsibility per file/layer.** Routers route, models validate, services do the
   real work, utils are dumb reusable helpers. If a file does two jobs, split it.
3. **Dependency direction is one-way:** `api → services → utils`. Utils never import services;
   services never import routers. Models (schemas) can be imported by anyone.
4. **No hardcoded values in logic.** Paths (`pdflatex` location), timeouts, CORS origins, temp
   dirs → all live in `core/config.py`, driven by env vars with sane defaults.
5. **Reusable by default.** Before adding code, ask "will this be needed again?" If yes, it goes
   in a service/util with a clear signature — not inline.
6. **Fail loud and clear.** A LaTeX error must return a clean, structured error (status + log
   snippet), never a 500 stack trace. Catch at the service boundary.
7. **Stateless & isolated.** Every compile runs in its **own temp directory** that is cleaned
   up afterward. No shared mutable state between requests. (This is what makes it safe to
   later run many requests at once and to drop into Docker unchanged.)
8. **Build incrementally.** Do NOT scaffold every file at once. Follow the build order in §7.

---

## 1. Folder structure

```
backend/
├── app/
│   ├── __init__.py
│   ├── main.py                 ← FastAPI app: create app, add CORS, include routers
│   │
│   ├── core/                   ← cross-cutting config & setup (no business logic)
│   │   ├── __init__.py
│   │   ├── config.py           ← Settings: PDFLATEX_PATH, COMPILE_TIMEOUT, CORS_ORIGINS...
│   │   └── logging.py          ← logging configuration
│   │
│   ├── api/                    ← the "waiter front desk" — HTTP layer ONLY
│   │   ├── __init__.py
│   │   └── routes/
│   │       ├── __init__.py
│   │       ├── health.py       ← GET /            (is the server alive?)
│   │       └── compile.py      ← POST /compile    (parses request, calls service)
│   │
│   ├── models/                 ← Pydantic schemas = the shape of requests/responses
│   │   ├── __init__.py
│   │   └── compile.py          ← CompileRequest, CompileError (validation + docs)
│   │
│   ├── services/               ← THE BRAINS — all real work lives here
│   │   ├── __init__.py
│   │   └── latex_service.py    ← compile_latex(code) -> pdf_bytes (the heart of the app)
│   │
│   └── utils/                  ← small, dumb, reusable helpers (no app knowledge)
│       ├── __init__.py
│       ├── files.py            ← temp-dir creation/cleanup, safe file writes
│       └── errors.py           ← custom exceptions + LaTeX-log parsing
│
├── tests/                      ← pytest tests, mirrors app/ structure
│   └── __init__.py
│
├── requirements.txt            ← dependencies (fastapi, uvicorn)
├── .env.example                ← documents every env var (copy to .env locally)
└── .gitignore                  ← ignores venv/, .env, __pycache__/, *.pdf, *.aux, *.log
```

`venv/` lives in `backend/` but is **never committed** (it's in `.gitignore`).

---

## 2. What each layer is allowed to do

| Layer        | Job                                              | MUST NOT                                  |
|--------------|--------------------------------------------------|-------------------------------------------|
| `api/routes` | read request, call a service, shape HTTP response | run subprocess, touch files, hold logic   |
| `models`     | define + validate request/response shapes (Pydantic) | contain logic or side effects          |
| `services`   | the actual work: orchestrate compile, errors      | know about HTTP (no `Request`/`Response`) |
| `utils`      | tiny reusable helpers (files, errors, parsing)    | import services or know the app's purpose |
| `core`       | config, logging, app-wide setup                   | contain feature logic                     |

**Litmus test:** a service function should be callable from a CLI script or a test with zero
FastAPI imports. If it needs `Request`, it's in the wrong layer.

---

## 3. The core service (the heart — keep it pure & reusable)

`services/latex_service.py` — signature locked so it never has to change shape:

```
compile_latex(code: str, *, engine: str = "pdflatex") -> bytes
    1. make an isolated temp dir            (utils/files.py)
    2. write code -> resume.tex             (utils/files.py)
    3. run <engine> resume.tex              (subprocess, path from config, with timeout)
    4. on success: read resume.pdf -> bytes
    5. on failure: raise LatexCompileError(log)   (utils/errors.py)
    6. always: clean up the temp dir         (finally)
```

- Takes a **string**, returns **bytes**. No HTTP, no globals. Trivially testable and reusable.
- `engine` param now defaults to `pdflatex`; leaving the door open for `xelatex`/`lualatex`
  later (fancy templates) WITHOUT changing callers.
- The route in `api/routes/compile.py` just does: validate body → `compile_latex(...)` →
  return `Response(content=pdf, media_type="application/pdf")`, and maps
  `LatexCompileError` → HTTP 422 with the log.

---

## 4. Configuration (no magic values)

Everything environment-specific lives in `core/config.py` (Pydantic `BaseSettings`), with
defaults so it runs out-of-the-box on this Mac:

| Setting           | Default (dev / Mac)                                              | Why it's configurable                       |
|-------------------|-----------------------------------------------------------------|---------------------------------------------|
| `PDFLATEX_PATH`   | `/usr/local/texlive/2026basic/bin/universal-darwin/pdflatex`    | Docker/Linux path differs → override by env |
| `COMPILE_TIMEOUT` | `20` (seconds)                                                  | kill runaway/malicious compiles             |
| `CORS_ORIGINS`    | `http://localhost:5173` (React dev)                            | prod frontend URL differs                   |
| `MAX_CODE_BYTES`  | e.g. `1_000_000`                                               | reject absurdly large input                 |

⚠️ The `PDFLATEX_PATH` default is the Mac BasicTeX path. **In Docker, set it via env** (or rely
on PATH) — see DEPLOYMENT.md. Never hardcode this inside a service.

---

## 5. Dependencies (`requirements.txt`)

```
fastapi              ← web framework (defines endpoints)
uvicorn[standard]    ← ASGI server that runs the app (uvicorn app.main:app --reload)
pydantic-settings    ← typed settings from env vars (for core/config.py)
```

- CORS: built into FastAPI (`CORSMiddleware`) — **no extra package**.
- Returning PDFs: built into FastAPI (`Response`) — **no extra package**.
- Pin exact versions once it works, so dev and Docker install the same thing.

---

## 6. Request flow mapped to the structure

```
Browser ──POST /compile {code}──► api/routes/compile.py
                                      │  validate with models/compile.py (CompileRequest)
                                      ▼
                                  services/latex_service.compile_latex(code)
                                      │  utils/files.py  (temp dir, write resume.tex)
                                      │  subprocess pdflatex  (path/timeout from core/config)
                                      │  utils/errors.py (parse log on failure)
                                      ▼
                              returns pdf bytes  ──►  Response(media_type="application/pdf")
                                                          │
Browser ◄──────────────── PDF (or 422 + error log) ◄──────┘
```

---

## 7. Build order (do NOT build everything at once)

Each step ends in something runnable/testable before moving on:

```
B1. requirements.txt + venv + install            → environment ready
B2. app/main.py + api/routes/health.py           → server boots, GET / returns ok
B3. core/config.py                                → config loads (pdflatex path, timeout)
B4. utils/files.py + utils/errors.py              → reusable helpers exist + unit-tested
B5. services/latex_service.py                     → compile_latex() works from a test script
B6. models/compile.py + api/routes/compile.py     → POST /compile returns a real PDF
B7. wire CORS + .env.example + .gitignore         → ready for the React frontend
```

Stop and verify at each step. B5 is the "it clicks" moment (PDF from a plain Python call).

---

## 8. Future extensions (where they slot in — don't build yet)

Designed so these drop in WITHOUT rewriting the core:

| Future feature              | Where it goes                                            |
|-----------------------------|----------------------------------------------------------|
| `xelatex`/`lualatex` support | `latex_service` already has `engine` param; add to config |
| Auth / API keys             | FastAPI dependency in `api/` (e.g. `core/security.py`)   |
| Rate limiting               | middleware in `main.py` or a dependency                  |
| Caching identical compiles  | new `services/cache_service.py`, called before compiling |
| Multiple files / \input     | extend `utils/files.py` to write a project tree          |
| Background/async queue      | service stays the same; add a worker that calls it       |

The rule that makes all this cheap: **the route never knows how compiling works, and the
service never knows it's behind HTTP.**

---

## 9. Quick "don't forget" checklist

- [ ] Routers stay thin — logic in services.
- [ ] No hardcoded paths/timeouts — use `core/config.py`.
- [ ] Each compile in its own temp dir, cleaned up in `finally`.
- [ ] LaTeX failures → structured 422 + log, never a 500.
- [ ] `compile_latex(code) -> bytes` keeps its signature (reuse).
- [ ] `venv/`, `.env`, `*.aux/*.log/*.pdf` are gitignored.
- [ ] Keep `PDFLATEX_PATH` in sync with DEVELOPMENT.md / DEPLOYMENT.md.
```
