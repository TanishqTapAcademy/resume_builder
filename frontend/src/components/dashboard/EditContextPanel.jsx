// Edit-mode context card (right column, above the chat): a Back button, the match score,
// and a collapsible job description so the user can free up vertical space for the chat.

import { useState } from 'react'
import { ArrowLeft, ChevronDown, Target } from 'lucide-react'

export default function EditContextPanel({ jd, score, onExit }) {
  const [open, setOpen] = useState(false)

  return (
    <div className="glass rounded-2xl">
      <div className="flex items-center justify-between gap-2 px-4 py-3">
        <button
          onClick={onExit}
          className="inline-flex items-center gap-1.5 text-sm font-medium text-white/80 transition hover:text-white"
        >
          <ArrowLeft className="h-4 w-4" /> Back
        </button>

        <div className="flex items-center gap-3">
          {score != null && (
            <span className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-500/15 px-2.5 py-1 text-xs font-medium text-emerald-200">
              <Target className="h-3.5 w-3.5" /> Match {score}
            </span>
          )}
          <button
            onClick={() => setOpen((o) => !o)}
            className="inline-flex items-center gap-1 text-xs text-[var(--color-muted)] transition hover:text-white"
          >
            Job description
            <ChevronDown className={`h-3.5 w-3.5 transition ${open ? 'rotate-180' : ''}`} />
          </button>
        </div>
      </div>

      {open && (
        <div className="max-h-44 overflow-auto whitespace-pre-wrap border-t border-[var(--color-border)] px-4 py-3 text-xs leading-relaxed text-white/70">
          {jd?.trim() || 'No job description provided.'}
        </div>
      )}
    </div>
  )
}
