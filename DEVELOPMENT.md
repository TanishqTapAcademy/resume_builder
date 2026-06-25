# DEVELOPMENT — Building the LaTeX Resume Builder on My Own Computer

> Goal: A mini-Overleaf. I type LaTeX code on the left, see a live PDF preview on
> the right, and download the PDF. This file covers building & running it on my
> own Mac. **No Docker is needed here** — Docker only comes in for deployment
> (see DEPLOYMENT.md).

---

## The simple idea

Overleaf does two jobs:
1. A place to **type code** (an editor).
2. A program that **turns LaTeX code → PDF** (the "compiler").

I'm rebuilding both myself.

Restaurant analogy 🍽️:

| Part   | Restaurant role             | What it really is                                   |
|--------|-----------------------------|-----------------------------------------------------|
| React  | Dining room (what I see)    | Webpage: code editor + PDF preview + download button|
| Python | Waiter (takes the order)    | Receives LaTeX code, runs LaTeX, returns the PDF     |
| LaTeX  | Chef (actually cooks)       | The program that turns LaTeX code into a PDF         |

(Docker = a food-truck/kitchen-in-a-box. Not used in development — see DEPLOYMENT.md.)

---

## What "LaTeX install" means

LaTeX is a **real program**, like installing Photoshop or Chrome. Installing it puts
a program on the computer that knows how to:

> read LaTeX code (`\textbf{Tanishq}`) → produce a finished PDF

- On Mac: **MacTeX** (full, ~4 GB) or **BasicTeX** (small, ~100 MB).
- After installing, the computer gets a command called **`pdflatex`** (or `xelatex`).
- Give it a `.tex` file → it produces a `.pdf`. That's the whole magic.

**"Installing LaTeX" = putting the chef in the kitchen.** Without it, Python has the
order but no one to cook.

---

## LaTeX setup — the exact install I'm using (DECIDED) 🔑

I am **not** installing the full MacTeX (~4–5 GB). Instead: **BasicTeX (~100 MB) +
three "collections"** (bundles of packages). This compiles my real resume — which uses
icon fonts (`fontawesome5`, `marvosym`) — and basically every other resume template,
without "missing package" errors, at about **a quarter of MacTeX's size**.

**A "collection" = a parent bundle** that contains hundreds of related packages, so I
install the parent once instead of naming each package by hand.

### The commands (run once on my Mac)

```bash
brew install --cask basictex            # BasicTeX (~100 MB), via Homebrew (from tug.org)
eval "$(/usr/libexec/path_helper)"       # reload PATH so pdflatex/tlmgr are found
sudo tlmgr update --self                 # update the package manager first
sudo tlmgr install \
  collection-latexextra \                # all layout packages: titlesec, enumitem, tabularx, multicol, fancyhdr...
  collection-fontsrecommended \          # standard fonts
  collection-fontsextra                  # ALL fonts + icons: fontawesome5, marvosym, Roboto, Lato, Source Sans...
```

### The bundles and total size

| Bundle                        | What it gives                                              | Size       |
|-------------------------------|------------------------------------------------------------|------------|
| BasicTeX base                 | TeX engine + core LaTeX + `latexrecommended` + `xetex`     | ~100 MB    |
| `collection-latexextra`       | layout: titlesec, enumitem, tabularx, multicol, fancyhdr…  | ~250 MB    |
| `collection-fontsrecommended` | standard everyday fonts                                    | ~75 MB     |
| `collection-fontsextra`       | every font + every icon set (fontawesome5, marvosym…)      | ~450–500 MB|
| **TOTAL**                     |                                                            | **~1 GB**  |

- Compiler used: **`pdflatex`** (my resume uses `\pdfgentounicode` + `\input{glyphtounicode}`,
  which are pdfTeX features — so it must be `pdflatex`, not `xelatex`).
- If a future template ever needs something not included, the error names the package
  and it's one `sudo tlmgr install <name>` away.
- ⚠️ **Deployment must match this.** The Docker image (DEPLOYMENT.md) installs the **same
  three collections** so the online app produces the exact same PDF. Keep them in sync.

---

## The heart of the whole app (one key move)

Everything else just wraps around this single action that Python performs:

```
take the user's code → save as resume.tex → run "pdflatex resume.tex" → get resume.pdf back
```

---

## Architecture (development, on my Mac)

```
┌─────────────────────────── MY BROWSER ───────────────────────────────┐
│                                                                       │
│   REACT FRONTEND (the dining room)                                    │
│   ┌─────────────────────┐      ┌─────────────────────┐                │
│   │  Code editor         │      │   PDF preview        │               │
│   │  \textbf{Tanishq}    │      │   [ nice resume ]    │               │
│   │  \section{Skills}    │      │                      │               │
│   └─────────────────────┘      └─────────────────────┘                │
│              │                          ▲      [ Download PDF ]         │
└──────────────┼──────────────────────────┼─────────────────────────────┘
               │  sends LaTeX code         │  sends PDF back
               ▼                           │
┌────────────────── MY MAC (running locally) ──────────────────────────┐
│                                                                       │
│   PYTHON BACKEND (the waiter)                                         │
│   1. receives the LaTeX code                                         │
│   2. saves it to a file:  resume.tex                                 │
│   3. runs the chef:       pdflatex resume.tex                        │
│   4. gets resume.pdf                                                 │
│   5. sends the PDF back to React                                     │
│              │                                                        │
│              ▼                                                        │
│   LaTeX (the chef) ── installed directly on my Mac ──                │
│   turns resume.tex → resume.pdf                                       │
└───────────────────────────────────────────────────────────────────────┘
```

---

## The full flow (one round trip)

1. I type LaTeX code in the React editor.
2. I click "Compile" (or it auto-runs).
3. React **sends the code** to Python (running on my Mac).
4. Python **saves** it as `resume.tex`.
5. Python **runs LaTeX** (`pdflatex`) — the chef cooks the PDF.
6. Python **sends the PDF back** to React.
7. React **shows the PDF** and lets me **download** it.

Typical time: **1–3 seconds.** ⚡

---

## What I need installed on my Mac

- **Python** — runs the backend (the waiter). ✅ already on my Mac (3.9.6).
- **Node.js** — needed to run/build React (the dining room). ✅ already on my Mac (v24).
- **LaTeX** — the chef, the must-have for PDF output. ❌ not yet installed →
  install **BasicTeX + 3 collections** per the "LaTeX setup" section above (~1 GB).

(Checked: Python, Node, npm, and Homebrew are already installed. Only LaTeX is missing.)

---

## Folder structure

```
resume_builder/
├── frontend/                 ← React lives here (editor + preview UI)
│
├── backend/                  ← Python lives here
│   ├── app.py                ← the waiter (receives code, runs LaTeX)
│   └── requirements.txt      ← list of Python helpers to install
│
├── DEVELOPMENT.md            ← this file
└── DEPLOYMENT.md             ← how to put it online (adds Docker)
```

---

## Build order (recommended)

1. **Backend first** — Python + LaTeX making a PDF from sample code.
   (When the first PDF pops out, the whole thing "clicks".)
2. **Frontend** — React editor + PDF preview + download button.
3. **Connect them** — React sends code to Python, shows the PDF back.

---

## One-breath recap

- **React** = the screen I see (editor + preview + download).
- **Python** = middleman that runs LaTeX and passes files around.
- **LaTeX** = the program that makes the PDF ("install" = put that program on the machine).
- Flow: **browser → Python → LaTeX → PDF → back to browser.**
- **No Docker needed on my own Mac** — just install LaTeX once.
