// Env-driven config (FRONTEND.md §4). Vite exposes vars prefixed with VITE_.
// Defaults match local dev so the app runs with no .env file.

export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8000'

// Auto-compile fires this many ms after the user stops typing.
export const DEBOUNCE_MS = Number(import.meta.env.VITE_DEBOUNCE_MS ?? 3000)
