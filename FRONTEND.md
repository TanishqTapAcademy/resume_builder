# FRONTEND — Architecture & Rules (read this BEFORE touching frontend code)

> Purpose: The standing contract for the React frontend, mirroring BACKEND.md. The app's
> one screen: **a LaTeX editor on the left, a live PDF preview on the right.** Nothing more.
> Keep it clean, layered, and reusable.

Stack: **React + Vite** (lightweight build) + **Tailwind CSS** (styling) +
**CodeMirror** (code editor) + native **fetch** (talks to the backend `/compile`).

Design: **Dark developer theme** — near-black background, frosted-glass split panels,
violet/indigo accent, soft glow, monospace editor. Visuals must feel premium.

Compile behaviour: **both** — auto-compile **3 seconds** after typing stops, AND a manual
**Compile** button for instant runs.

---

## 0. Golden rules (never break these)

1. **Components are dumb; logic lives in hooks.** A component renders UI and calls a hook.
   No `fetch`, no debounce timers, no business logic inside JSX components.
2. **One responsibility per file.** A component renders one thing. A hook does one job.
   A service talks to one concern (the API).
3. **All network access goes through `services/api.js`.** Components/hooks never call
   `fetch` directly — so the backend URL, headers, and error handling live in one place.
4. **No hardcoded config.** The backend URL, debounce delay, etc. live in `src/config.js`
   (from Vite env vars `VITE_*`) with sensible dev defaults.
5. **Styling via Tailwind utility classes + theme tokens.** No scattered inline styles or
   magic hex codes in components — colors/spacing come from the theme (see `index.css`).
6. **Reusable by default.** Shared UI (buttons, panels, states) are small components, not
   copy-pasted markup.
7. **Handle every state.** The preview must show: idle, compiling, success (PDF), and
   error (show the LaTeX log). Never a blank screen with no explanation.
8. **Build incrementally** — follow the F1–F7 order in §6. Verify each step.

---

## 1. Folder structure

```
frontend/
├── index.html
├── package.json
├── vite.config.js              ← Vite + Tailwind plugin
├── .env.example                ← documents VITE_* env vars
├── .gitignore
└── src/
    ├── main.jsx                ← React entry point
    ├── App.jsx                 ← the one screen: header + split layout
    ├── index.css               ← Tailwind import + dark theme tokens
    │
    ├── config.js               ← env-driven config (API URL, debounce ms)
    │
    ├── services/               ← talks to the outside world (the backend)
    │   └── api.js              ← compileLatex(code) -> PDF Blob | throws
    │
    ├── hooks/                  ← reusable stateful logic (no UI)
    │   └── useCompile.js       ← debounced + manual compile, holds {pdfUrl, status, error}
    │
    ├── components/             ← dumb UI pieces (render + emit events)
    │   ├── Header.jsx          ← logo + Compile button + Download button
    │   ├── EditorPanel.jsx     ← CodeMirror LaTeX editor (left)
    │   └── PreviewPanel.jsx    ← PDF preview + idle/loading/error states (right)
    │
    └── lib/
        └── sampleResume.js     ← default LaTeX shown on first load
```

Mirrors the backend's layering: **services** (I/O) → **hooks** (logic) → **components** (UI),
with **config** and **lib** for constants. `node_modules/` and `dist/` are gitignored.

---

## 2. What each layer is allowed to do

| Layer        | Job                                                  | MUST NOT                              |
|--------------|------------------------------------------------------|---------------------------------------|
| `components` | render UI, call hooks, emit events (onChange, onClick) | fetch, debounce, hold business logic |
| `hooks`      | state + side effects (debounce, call service)        | render JSX / know Tailwind classes    |
| `services`   | HTTP to the backend, shape errors                    | hold React state or UI concerns       |
| `config.js`  | env-driven values                                    | contain logic                         |
| `lib`        | static constants (sample resume)                     | side effects                          |

**Litmus test:** `services/api.js` should be usable from a plain JS test with no React.
A component should contain no `setTimeout` or `fetch`.

---

## 3. The data flow (one round trip)

```
EditorPanel (onChange) ─► App state: code
        │  (3s idle)  OR  Header [Compile] click
        ▼
useCompile(code) ──► services/api.compileLatex(code)
        │                    │  POST http://localhost:8000/compile {code}
        │                    ▼
        │            backend runs pdflatex
        │                    │  200 → PDF blob   |   422 → {message, log}
        ▼                    ▼
   status: 'success' + pdfUrl (blob URL)   |   status: 'error' + log
        ▼
PreviewPanel renders the PDF (iframe)      |   renders the error log
```

- The PDF is received as a **Blob**, turned into a `blob:` URL via `URL.createObjectURL`,
  and shown in an `<iframe>`. Old blob URLs are revoked to avoid memory leaks.
- **Download** uses the same blob URL with a `download` attribute.

---

## 4. Configuration (`src/config.js`, from Vite `VITE_*` env)

| Setting            | Env var               | Default (dev)            | Why configurable                |
|--------------------|-----------------------|--------------------------|---------------------------------|
| Backend base URL   | `VITE_API_BASE_URL`   | `http://localhost:8000`  | differs in prod (Render URL)    |
| Auto-compile delay | `VITE_DEBOUNCE_MS`    | `3000` (3s)              | tune the live-preview feel      |

⚠️ Keep the backend URL in sync with the backend's CORS origins (BACKEND.md / config.py).

---

## 5. Dependencies

```
react, react-dom              ← UI
vite, @vitejs/plugin-react    ← build/dev server
tailwindcss, @tailwindcss/vite ← styling
@uiw/react-codemirror         ← the code editor component
@codemirror/legacy-modes      ← LaTeX (stex) syntax highlighting
```

Native `fetch` for HTTP — no axios needed. No PDF library — the browser renders PDFs natively.

---

## 6. Build order (do NOT build everything at once)

```
F1. scaffold Vite+React, install deps                 → tooling ready
F2. configure Vite + Tailwind + dark theme tokens     → dev server shows a styled page
F3. config.js + services/api.js                       → compileLatex() callable
F4. lib/sampleResume.js + hooks/useCompile.js         → debounced + manual compile logic
F5. components: Header, EditorPanel, PreviewPanel      → each renders in isolation
F6. App.jsx — assemble split layout + glass/glow       → full screen comes together
F7. run dev server, verify type → live preview         → end-to-end working
```

Verify at each step. F7 is the payoff: type LaTeX → PDF updates on the right.

---

## 7. Future extensions (where they slot in — don't build yet)

| Future feature              | Where it goes                                          |
|-----------------------------|--------------------------------------------------------|
| Multiple resume templates   | `lib/` templates + a picker component                  |
| Save/load resumes           | new `services/storage.js` + a hook                     |
| Auth                        | `services/api.js` adds auth header; an auth hook       |
| Resizable split panes       | a layout component wrapping the two panels             |
| Syntax error inline markers | extend `EditorPanel` using the backend error log       |

The rule that keeps this cheap: **components never fetch, services never render.**

---

## 8. Quick "don't forget" checklist

- [ ] No `fetch` or `setTimeout` inside components — those live in services/hooks.
- [ ] All API calls go through `services/api.js`.
- [ ] Backend URL + debounce come from `config.js` (env), not hardcoded.
- [ ] Preview handles idle / compiling / success / error — never blank.
- [ ] Revoke old blob URLs to avoid leaks.
- [ ] Keep `VITE_API_BASE_URL` in sync with backend CORS origins.
- [ ] Colors/spacing via Tailwind theme tokens, not magic values.
