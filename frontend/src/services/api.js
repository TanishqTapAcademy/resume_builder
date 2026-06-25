// All backend communication lives here (FRONTEND.md §0 rule 3).
// Components/hooks never call fetch directly — only this module does.

import { API_BASE_URL } from '../config'

/** Error thrown when the backend reports a LaTeX compile failure (HTTP 422). */
export class CompileError extends Error {
  constructor(message, log = '') {
    super(message)
    this.name = 'CompileError'
    this.log = log
  }
}

/**
 * Send LaTeX source to the backend and get back a PDF.
 * @param {string} code - the full LaTeX source
 * @returns {Promise<Blob>} the compiled PDF as a Blob
 * @throws {CompileError} on a LaTeX failure (carries the log)
 * @throws {Error} on a network/unexpected failure
 */
export async function compileLatex(code) {
  let res
  try {
    res = await fetch(`${API_BASE_URL}/compile`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code }),
    })
  } catch {
    throw new Error('Could not reach the backend. Is the server running?')
  }

  if (res.ok) {
    return res.blob()
  }

  // Backend returns { detail: { message, log } } on a 422 compile error.
  if (res.status === 422) {
    let detail = {}
    try {
      const body = await res.json()
      detail = body.detail ?? {}
    } catch {
      /* fall through to generic message */
    }
    throw new CompileError(
      detail.message ?? 'LaTeX compilation failed.',
      detail.log ?? '',
    )
  }

  throw new Error(`Unexpected server error (HTTP ${res.status}).`)
}
