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

/** Error thrown when the backend can't produce a valid resume (HTTP 422). */
export class GenerationError extends Error {
  constructor(message, log = '') {
    super(message)
    this.name = 'GenerationError'
    this.log = log
  }
}

const UNREACHABLE = 'Could not reach the backend. Is the server running?'

/**
 * Score the stored profile against a job description.
 * @returns {Promise<{score:number, fit:boolean, missing:string[], suggestions:string[]}>}
 */
export async function getMatch(jd, company) {
  let res
  try {
    res = await fetch(`${API_BASE_URL}/match`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ jd, company }),
    })
  } catch {
    throw new Error(UNREACHABLE)
  }

  if (res.ok) return res.json()

  if (res.status === 503) {
    throw new Error('AI service unavailable — is OPENAI_API_KEY set on the backend?')
  }
  throw new Error(`Unexpected server error (HTTP ${res.status}).`)
}

/**
 * Generate a tailored resume from profile + JD + reference template.
 * @returns {Promise<{blob: Blob, warning: string}>} the PDF and any warning header
 * @throws {GenerationError} on a hard failure (carries the log)
 */
export async function generateResume(jd, company, referenceTemplate) {
  let res
  try {
    res = await fetch(`${API_BASE_URL}/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ jd, company, referenceTemplate }),
    })
  } catch {
    throw new Error(UNREACHABLE)
  }

  if (res.ok) {
    const blob = await res.blob()
    return { blob, warning: res.headers.get('X-Resume-Warning') ?? '' }
  }

  if (res.status === 422) {
    let detail = {}
    try {
      detail = (await res.json()).detail ?? {}
    } catch {
      /* generic message below */
    }
    throw new GenerationError(detail.message ?? 'Generation failed.', detail.log ?? '')
  }
  if (res.status === 503) {
    throw new Error('AI service unavailable — is OPENAI_API_KEY set on the backend?')
  }
  throw new Error(`Unexpected server error (HTTP ${res.status}).`)
}
