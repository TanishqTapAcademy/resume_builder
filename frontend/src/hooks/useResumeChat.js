// Chat editor state for the post-generation "edit on top of the resume" flow.
// Keeps the message log and sends edits; on success it hands the new PDF + LaTeX back to
// useGenerate via applyEditedResult so the preview updates in place.

import { useCallback, useState } from 'react'

import { editResume } from '../services/api'

/**
 * @param {{ applyEditedResult: (r:{tex:string, blob:Blob, warning:string}) => void }} opts
 * @returns {{ messages, status, send, reset }}
 *   messages: [{ role:'user'|'assistant', text, section?, ok? }]
 *   status: 'idle' | 'sending'
 *   send(message, tex, jd): edit the CURRENT tex (passed in so it's always the latest)
 */
export function useResumeChat({ applyEditedResult }) {
  const [messages, setMessages] = useState([])
  const [status, setStatus] = useState('idle')

  const send = useCallback(
    async (message, tex, jd) => {
      const text = (message || '').trim()
      if (!text || status === 'sending' || !tex) return
      setMessages((m) => [...m, { role: 'user', text }])
      setStatus('sending')
      try {
        const r = await editResume(tex, text, jd)
        if (r.ok && r.blob) {
          applyEditedResult({ tex: r.tex, blob: r.blob, warning: r.warning })
        }
        setMessages((m) => [
          ...m,
          { role: 'assistant', text: r.reply, section: r.section, ok: r.ok },
        ])
      } catch (err) {
        setMessages((m) => [...m, { role: 'assistant', text: err.message, ok: false }])
      } finally {
        setStatus('idle')
      }
    },
    [applyEditedResult, status],
  )

  const reset = useCallback(() => setMessages([]), [])

  return { messages, status, send, reset }
}
