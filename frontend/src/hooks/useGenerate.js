// Generation logic lives here, not in components (FRONTEND.md §0 rules 1 & 2).
// generate(jd, score) -> tracks {status, pdfUrl, tex, warning, error}.
//
// Also holds the LaTeX source (session memory) and exposes applyEditedResult so the
// post-generation chat editor can swap in an edited PDF + source without re-fetching.

import { useCallback, useEffect, useRef, useState } from 'react'

import { GenerationError, generateResume } from '../services/api'

/**
 * @returns {{ status, pdfUrl, tex, warning, error, generate, applyEditedResult }}
 *   status: 'idle' | 'generating' | 'success' | 'error'
 */
export function useGenerate() {
  const [status, setStatus] = useState('idle')
  const [pdfUrl, setPdfUrl] = useState(null)
  const [tex, setTex] = useState('')
  const [warning, setWarning] = useState('')
  const [error, setError] = useState(null)

  const urlRef = useRef(null)
  const reqId = useRef(0)

  const swapUrl = useCallback((blob) => {
    const url = URL.createObjectURL(blob)
    if (urlRef.current) URL.revokeObjectURL(urlRef.current)
    urlRef.current = url
    return url
  }, [])

  const generate = useCallback(
    async (jd, score = null) => {
      const my = ++reqId.current
      setStatus('generating')
      setError(null)
      setWarning('')
      try {
        const { blob, tex: newTex, warning: w } = await generateResume(jd, score)
        if (my !== reqId.current) return
        setPdfUrl(swapUrl(blob))
        setTex(newTex)
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
    },
    [swapUrl],
  )

  // Swap in an edited result from the chat editor (keeps status 'success').
  const applyEditedResult = useCallback(
    ({ tex: newTex, blob, warning: w }) => {
      if (blob) setPdfUrl(swapUrl(blob))
      if (typeof newTex === 'string') setTex(newTex)
      if (typeof w === 'string') setWarning(w)
    },
    [swapUrl],
  )

  // Revoke the last blob URL on unmount.
  useEffect(
    () => () => {
      if (urlRef.current) URL.revokeObjectURL(urlRef.current)
    },
    [],
  )

  return { status, pdfUrl, tex, warning, error, generate, applyEditedResult }
}
