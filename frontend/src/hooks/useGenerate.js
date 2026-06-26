// Generation logic lives here, not in components (FRONTEND.md §0 rules 1 & 2).
// generate(jd, company, template) -> tracks {status, pdfUrl, warning, error}.

import { useCallback, useEffect, useRef, useState } from 'react'

import { GenerationError, generateResume } from '../services/api'

/**
 * @returns {{ status, pdfUrl, warning, error, generate }}
 *   status: 'idle' | 'generating' | 'success' | 'error'
 */
export function useGenerate() {
  const [status, setStatus] = useState('idle')
  const [pdfUrl, setPdfUrl] = useState(null)
  const [warning, setWarning] = useState('')
  const [error, setError] = useState(null)

  const urlRef = useRef(null)
  const reqId = useRef(0)

  const generate = useCallback(async (jd, company, template) => {
    const my = ++reqId.current
    setStatus('generating')
    setError(null)
    setWarning('')
    try {
      const { blob, warning: w } = await generateResume(jd, company, template)
      if (my !== reqId.current) return
      const url = URL.createObjectURL(blob)
      if (urlRef.current) URL.revokeObjectURL(urlRef.current)
      urlRef.current = url
      setPdfUrl(url)
      setWarning(w)
      setStatus('success')
    } catch (err) {
      if (my !== reqId.current) return
      setError({
        message: err.message,
        log: err instanceof GenerationError ? err.log : '',
      })
      setStatus('error')
    }
  }, [])

  // Revoke the last blob URL on unmount.
  useEffect(
    () => () => {
      if (urlRef.current) URL.revokeObjectURL(urlRef.current)
    },
    [],
  )

  return { status, pdfUrl, warning, error, generate }
}
