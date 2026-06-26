// Escape hatch: edit the raw profile JSON directly. Validates before saving so a typo
// can't corrupt the stored profile.

import { useState } from 'react'
import { X, Loader2 } from 'lucide-react'

export default function RawEditor({ data, onSave, onClose }) {
  const [text, setText] = useState(JSON.stringify(data, null, 2))
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  async function save() {
    let parsed
    try {
      parsed = JSON.parse(text)
    } catch {
      setError('That isn’t valid JSON — check for a missing comma or brace.')
      return
    }
    if (typeof parsed !== 'object' || Array.isArray(parsed)) {
      setError('The profile must be a JSON object.')
      return
    }
    setError('')
    setBusy(true)
    try {
      await onSave(parsed)
      onClose()
    } catch (err) {
      setError(err.message || 'Could not save.')
      setBusy(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/70 p-4 backdrop-blur-sm">
      <div className="glass flex h-[80vh] w-full max-w-3xl flex-col rounded-2xl">
        <div className="flex items-center justify-between border-b border-[var(--color-border)] px-5 py-3">
          <h3 className="font-semibold text-white">Edit raw profile JSON</h3>
          <button onClick={onClose} className="text-[var(--color-muted)] hover:text-white">
            <X className="h-5 w-5" />
          </button>
        </div>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          spellCheck={false}
          className="flex-1 resize-none bg-transparent p-5 font-mono text-sm text-white/90 outline-none"
        />
        <div className="flex items-center justify-between border-t border-[var(--color-border)] px-5 py-3">
          <p className="text-sm text-red-300">{error}</p>
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="rounded-lg border border-[var(--color-border)] px-4 py-2 text-sm text-white/90 transition hover:bg-white/5"
            >
              Cancel
            </button>
            <button
              onClick={save}
              disabled={busy}
              className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-blue-500 to-emerald-500 px-4 py-2 text-sm font-semibold text-white transition hover:brightness-110 disabled:opacity-50"
            >
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Save'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
