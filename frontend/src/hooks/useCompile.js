// Compile logic lives here, not in components (FRONTEND.md §0 rules 1 & 2).
// Provides: live auto-compile (debounced) + a manual compileNow(), and tracks
// the resulting PDF blob URL / status / error.

import { useCallback, useEffect, useRef, useState } from 'react'

import { DEBOUNCE_MS } from '../config'
import { CompileError, compileLatex } from '../services/api'

/**
 * @param {string} code - current LaTeX source
 * @returns {{ status, pdfUrl, error, compileNow }}
 *   status: 'idle' | 'compiling' | 'success' | 'error'
 */
export function useCompile(code) {
  const [status, setStatus] = useState('idle')
  const [pdfUrl, setPdfUrl] = useState(null)
  const [error, setError] = useState(null)

  const pdfUrlRef = useRef(null)   // current blob URL, for revoking
  const reqIdRef = useRef(0)       // guards against stale/overlapping responses
  const firstRunRef = useRef(true) // compile immediately on first load

  const compileNow = useCallback(async () => {
    const myReq = ++reqIdRef.current
    setStatus('compiling')
    setError(null)
    try {
      const blob = await compileLatex(code)
      if (myReq !== reqIdRef.current) return // a newer request superseded this one
      const url = URL.createObjectURL(blob)
      if (pdfUrlRef.current) URL.revokeObjectURL(pdfUrlRef.current)
      pdfUrlRef.current = url
      setPdfUrl(url)
      setStatus('success')
    } catch (err) {
      if (myReq !== reqIdRef.current) return
      setError({
        message: err.message,
        log: err instanceof CompileError ? err.log : '',
      })
      setStatus('error')
    }
  }, [code])

  // First load: compile immediately. Subsequent edits: debounce by DEBOUNCE_MS.
  useEffect(() => {
    if (firstRunRef.current) {
      firstRunRef.current = false
      compileNow()
      return
    }
    const timer = setTimeout(compileNow, DEBOUNCE_MS)
    return () => clearTimeout(timer)
  }, [code, compileNow])

  // Revoke the last blob URL when the component unmounts.
  useEffect(
    () => () => {
      if (pdfUrlRef.current) URL.revokeObjectURL(pdfUrlRef.current)
    },
    [],
  )

  return { status, pdfUrl, error, compileNow }
}
