// Right-side chat panel for editing a generated resume conversationally.
// Dumb component: it renders the message log + input; useResumeChat owns the async work.

import { useEffect, useRef, useState } from 'react'
import { Loader2, Send, Sparkles, User } from 'lucide-react'

const SUGGESTIONS = [
  'Make the summary punchier',
  'Shorten the first experience bullet',
  'Add Python to my skills',
]

export default function ResumeChat({ chat, onSend, disabled = false }) {
  const [input, setInput] = useState('')
  const endRef = useRef(null)
  const sending = chat.status === 'sending'

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [chat.messages, sending])

  function submit(e) {
    e.preventDefault()
    const text = input.trim()
    if (!text || sending || disabled) return
    onSend(text)
    setInput('')
  }

  return (
    <div className="glass flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl">
      <div className="flex items-center gap-2 border-b border-[var(--color-border)] px-4 py-3 text-sm font-semibold text-white">
        <Sparkles className="h-4 w-4 text-blue-300" /> Edit with chat
      </div>

      <div className="min-h-0 flex-1 space-y-3 overflow-auto px-4 py-4">
        {chat.messages.length === 0 && (
          <div className="space-y-3">
            <p className="text-xs text-[var(--color-muted)]">
              Tell me what to change and I’ll edit just that part of the resume to keep it fast.
            </p>
            <div className="flex flex-wrap gap-2">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  onClick={() => onSend(s)}
                  disabled={disabled || sending}
                  className="rounded-full border border-[var(--color-border)] px-3 py-1 text-xs text-white/70 transition hover:bg-white/5 disabled:opacity-40"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {chat.messages.map((m, i) => (
          <Bubble key={i} m={m} />
        ))}

        {sending && (
          <div className="flex items-center gap-2 text-xs text-[var(--color-muted)]">
            <Loader2 className="h-3.5 w-3.5 animate-spin" /> Editing…
          </div>
        )}
        <div ref={endRef} />
      </div>

      <form
        onSubmit={submit}
        className="flex items-center gap-2 border-t border-[var(--color-border)] p-3"
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask for an edit…"
          disabled={disabled || sending}
          className="flex-1 rounded-xl border border-[var(--color-border)] bg-black/40 px-3 py-2 text-sm text-white/90 outline-none transition placeholder:text-[var(--color-muted)] focus:border-blue-500/60 disabled:opacity-50"
        />
        <button
          type="submit"
          disabled={disabled || sending || !input.trim()}
          className="rounded-xl bg-gradient-to-r from-blue-500 to-emerald-500 p-2.5 text-white transition hover:brightness-110 disabled:opacity-40"
          aria-label="Send edit"
        >
          <Send className="h-4 w-4" />
        </button>
      </form>
    </div>
  )
}

function Bubble({ m }) {
  const isUser = m.role === 'user'
  return (
    <div className={`flex gap-2 ${isUser ? 'justify-end' : ''}`}>
      {!isUser && <Sparkles className="mt-1.5 h-4 w-4 shrink-0 text-blue-300" />}
      <div
        className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm ${
          isUser ? 'bg-blue-500/20 text-white' : 'bg-white/5 text-white/85'
        }`}
      >
        {m.text}
        {!isUser && m.ok && m.section && (
          <span className="mt-1 block text-[11px] text-emerald-300/80">✓ edited {m.section}</span>
        )}
      </div>
      {isUser && <User className="mt-1.5 h-4 w-4 shrink-0 text-white/50" />}
    </div>
  )
}
