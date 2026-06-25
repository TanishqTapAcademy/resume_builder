# LaTeX Resume Builder 📄

> A **mini-Overleaf**: type LaTeX code on the left, see a live PDF preview on the right,
> and download the finished PDF. This README covers **what the project is** and the
> **deployment architecture** (how it goes online with Docker). For building it on a Mac,
> see [DEVELOPMENT.md](DEVELOPMENT.md); for full deploy notes see [DEPLOYMENT.md](DEPLOYMENT.md).

---

## 1. What this project is

Overleaf does two jobs, and we rebuild both:

1. A place to **type LaTeX code** (an editor in the browser).
2. A program that **turns LaTeX code → PDF** (the compiler).

The whole app is built around one single action the backend performs:

```
take the user's code → save as resume.tex → run "pdflatex resume.tex" → return resume.pdf
```

Everything else just wraps around that one move.

---

## 2. The three components (restaurant analogy 🍽️)

| Part   | Restaurant role          | What it really is                                          |
|--------|--------------------------|------------------------------------------------------------|
| **React**  | Dining room (what I see) | Webpage: code editor + PDF preview + download button   |
| **Python** | Waiter (takes the order) | Receives LaTeX code, runs LaTeX, returns the PDF        |
| **LaTeX**  | Chef (actually cooks)    | The program that turns LaTeX code into a PDF            |
| **Docker** | Food truck (sealed kitchen) | A sealed box carrying Python **+** LaTeX together, so LaTeX is always present wherever we ship it |

- **React** and **Python** are *our code*.
- **LaTeX** is a large third-party program (`pdflatex`) that must be physically installed.
- **Docker** only appears in **deployment**  it guarantees LaTeX ships with the backend.

---

## 3. Tech stack

| Layer        | Technology                          | Notes                                            |
|--------------|-------------------------------------|--------------------------------------------------|
| Frontend     | **React** (Node.js to build)        | Code editor + PDF preview + download             |
| Backend      | **Python** (Flask/FastAPI)          | Receives code, runs LaTeX, returns PDF           |
| Compiler     | **LaTeX → `pdflatex`**              | Uses pdfTeX features (`glyphtounicode`)          |
| LaTeX dist   | **BasicTeX + 3 collections** (dev) / **TeX Live + same 3 collections** (Docker) | ~1 GB; see §6 |
| Packaging    | **Docker** (deployment only)        | Carries Python + LaTeX together                  |
| Hosting      | Vercel/Netlify (frontend) + Render/Railway/Fly (backend) | Free tiers to start            |

---

## 4. Deployment architecture (the main view) 🚀

In production, the app is split across hosting providers, and the backend is wrapped in
a **Docker box** so LaTeX always comes along.

```
┌──────────────────────────── USER'S BROWSER ─────────────────────────────┐
│                                                                          │
│   REACT FRONTEND   (hosted on Vercel / Netlify  free)                   │
│   ┌──────────────────────┐        ┌──────────────────────┐              │
│   │  Code editor          │        │   PDF preview         │             │
│   │  \textbf{Tanishq}     │        │   [ rendered resume ] │             │
│   │  \section{Skills}     │        │                       │             │
│   └──────────────────────┘        └──────────────────────┘              │
│              │                              ▲     [ Download PDF ]         │
└──────────────┼──────────────────────────────┼────────────────────────────┘
               │  HTTPS: sends LaTeX code      │  HTTPS: sends PDF back
               ▼                               │
┌────────── DOCKER BOX (the food truck)  hosted on Render / Railway ───────┐
│                                                                          │
│   PYTHON BACKEND (the waiter)                                            │
│     1. receives the LaTeX code                                          │
│     2. saves it as           resume.tex                                 │
│     3. runs the chef:        pdflatex resume.tex                        │
│     4. gets                  resume.pdf                                 │
│     5. sends the PDF back to React                                      │
│                       │                                                  │
│                       ▼                                                  │
│   LaTeX (the chef) ── installed INSIDE the Docker box ──                │
│   TeX Live + collection-latexextra + fontsrecommended + fontsextra      │
│   turns resume.tex → resume.pdf                                          │
│                                                                          │
└──────────────────────────────────────────────────────────────────────────┘
```

**Why Docker here:** a fresh host arrives *blank* (Python only, no LaTeX). Some hosts
block installing big software. Docker removes all guesswork  LaTeX is baked into the box,
so it runs identically on my Mac, a free host, or a paid server.

---

## 5. The request flow (one round trip, ~1–3 seconds ⚡)

```
1. User types LaTeX code in the React editor.
2. User clicks "Compile" (or it auto-runs).
3. React  → sends the code over HTTPS to the Python backend (inside Docker).
4. Python → saves it as resume.tex.
5. Python → runs pdflatex resume.tex  (the chef cooks the PDF).
6. Python → sends resume.pdf back to React.
7. React  → shows the PDF and lets the user download it.
```

Identical 7 steps in development and production  only the *homes* change, and in
production LaTeX lives inside the Docker box instead of directly on the machine.

---

## 6. LaTeX setup  kept consistent dev ↔ prod 🔑

We deliberately avoid full MacTeX (~4–5 GB). Instead: a lean **~1 GB** setup that still
compiles real resumes (icons, fancy fonts) with **no missing-package errors**.

A **"collection"** is a parent bundle containing hundreds of related packages  install
the parent once instead of naming each package.

| Bundle                        | What it gives                                              | Size        |
|-------------------------------|------------------------------------------------------------|-------------|
| Base (BasicTeX / TeX Live)    | TeX engine + core LaTeX + `latexrecommended` + `xetex`     | ~100 MB     |
| `collection-latexextra`       | layout: titlesec, enumitem, tabularx, multicol, fancyhdr…  | ~250 MB     |
| `collection-fontsrecommended` | standard everyday fonts                                    | ~75 MB      |
| `collection-fontsextra`       | **all fonts + all icons** (fontawesome5, marvosym, Roboto…) | ~450–500 MB |
| **TOTAL**                     |                                                            | **~1 GB**   |

- **Compiler:** `pdflatex` (the resume uses `\pdfgentounicode` + `\input{glyphtounicode}`).
- **Development (Mac):** `brew install --cask basictex`, then `sudo tlmgr install` the 3 collections.
- **Production (Docker/Linux):** install **TeX Live** + the **same 3 collections** via `tlmgr`
  (BasicTeX/MacTeX are Mac-only, but the collection names are identical).
- ⚠️ **Same collections in → same PDF out.** If a package is added on the Mac, mirror it in
  the Dockerfile so dev and prod never drift.

---

## 7. Folder structure

```
resume_builder/
├── frontend/                 ← React (editor + preview UI)        [to be built]
│
├── backend/                  ← Python (FastAPI)                    ✅ BUILT
│   ├── app/
│   │   ├── main.py           ← app entry: CORS + wires routers
│   │   ├── core/config.py    ← settings (pdflatex path, timeout, limits)
│   │   ├── api/routes/       ← health.py (GET /) + compile.py (POST /compile)
│   │   ├── models/           ← request/response schemas (Pydantic)
│   │   ├── services/         ← latex_service.py — the heart (code → PDF)
│   │   └── utils/            ← files.py + errors.py (reusable helpers)
│   ├── tests/
│   ├── requirements.txt      ← fastapi, uvicorn, pydantic-settings (pinned)
│   ├── .env.example          ← documents every env var
│   └── .gitignore
│
├── Dockerfile                ← deployment recipe (installs LaTeX)  [Phase 2]
│
├── README.md                 ← this file (project + deployment architecture)
├── BACKEND.md                ← backend architecture & rules (read before editing backend)
├── DEVELOPMENT.md            ← build & run on my Mac (no Docker)
└── DEPLOYMENT.md             ← put it online (adds Docker)
```

> The backend is built as a clean **layered FastAPI** app (thin routes → services →
> utils). See **[BACKEND.md](BACKEND.md)** for the full architecture and the rules to
> follow when extending it.

---

## 8. Build & deploy roadmap

```
Phase 1  DEVELOPMENT.md   Mac + LaTeX + Python + React        → build & test, no Docker
Phase 2  DEPLOYMENT.md    Wrap backend in Docker              → test the box locally
Phase 3  Deploy           React → Vercel,  Docker box → Render
After that                 Every update → push to GitHub       → auto-redeploys ✨
```

Recommended build order within Phase 1:
1. ✅ **Backend first** — Python + LaTeX producing a PDF (FastAPI `/compile`, tested).
2. ⬜ **Frontend** — React editor + PDF preview + download button.
3. ⬜ **Connect them** — React sends code to Python, shows the PDF back.

---

## 9. Cost

| Piece                        | Where                          | Cost              |
|------------------------------|--------------------------------|-------------------|
| Frontend (React)             | Vercel / Netlify               | Free              |
| Backend (Python + LaTeX)     | Render / Railway / Fly free tier | $0 to start     |
| Docker (the tool)            |                               | Free, always      |
| Scaling beyond free limits   | Cheap VPS (Hetzner/DO)         | ~$4–6/month       |

**Docker itself is free.** The only thing that might cost money is the host  and that has
free tiers. To start: **frontend free + backend free tier = $0.**

---

## 10. One-breath recap

- **React** = the screen (editor + preview + download).
- **Python** = the middleman that runs LaTeX and passes files around.
- **LaTeX** (`pdflatex`) = the program that makes the PDF.
- **Docker** = a free box carrying Python + LaTeX together so LaTeX is always present in production.
- Flow: **browser → Python → LaTeX → PDF → back to browser.**
- LaTeX is **BasicTeX + 3 collections (~1 GB)** in dev, and the **same 3 collections** inside Docker for prod.
