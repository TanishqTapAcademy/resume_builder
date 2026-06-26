// Env-driven config (FRONTEND.md §4). Vite exposes vars prefixed with VITE_.
// Defaults match local dev so the app runs with no .env file.

export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8000'

// Auto-compile fires this many ms after the user stops typing.
export const DEBOUNCE_MS = Number(import.meta.env.VITE_DEBOUNCE_MS ?? 3000)

// Dashboard fit gate (FRONTEND.md): a fit check is required before generating.
//   score >= STRONG_FIT  -> strong fit
//   WEAK_FLOOR <= score < STRONG_FIT -> partial fit (allowed, advisory)
//   score < WEAK_FLOOR -> not a match (generation blocked)
export const STRONG_FIT = 70
export const WEAK_FLOOR = 20
