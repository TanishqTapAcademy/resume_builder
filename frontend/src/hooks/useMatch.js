// Match logic lives here, not in components (FRONTEND.md §0 rules 1 & 2).
// Manual checkFit(jd, company) -> tracks {status, result, error}.

import { useCallback, useRef, useState } from 'react'

import { getMatch } from '../services/api'

/**
 * @returns {{ status, result, error, checkFit }}
 *   status: 'idle' | 'checking' | 'done' | 'error'
 *   result: { score, fit, missing[], suggestions[] } | null
 */
export function useMatch() {
  const [status, setStatus] = useState('idle')
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)
  const reqId = useRef(0)

  const checkFit = useCallback(async (jd, company) => {
    if (!jd.trim()) return
    const my = ++reqId.current
    setStatus('checking')
    setError(null)
    try {
      const r = await getMatch(jd, company)
      if (my !== reqId.current) return // superseded by a newer check
      setResult(r)
      setStatus('done')
    } catch (err) {
      if (my !== reqId.current) return
      setError(err.message)
      setStatus('error')
    }
  }, [])

  return { status, result, error, checkFit }
}
