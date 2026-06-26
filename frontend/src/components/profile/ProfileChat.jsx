// Conversational profile editor. The conversation is SESSION-ONLY — it lives here in
// component state and is gone on refresh; the backend stores none of it. Each send posts
// the current profile + recent turns, gets back a short reply and (optionally) a partial
// patch of changed top-level sections. The user approves a patch before it's saved.

import { useRef, useState, useEffect } from 'react'
import { Send, Loader2, Check, X, Sparkles } from 'lucide-react'

import { profileChat } from '../../services/api'
import ProfileView from './ProfileView'

const GREETING = {
  role: 'assistant',
  content:
    "Hi! Tell me what to change — e.g. “add Docker to my skills”, “shorten my summary”, or “rename my latest job title”. I’ll show you the change before saving.",
}

export default function ProfileChat({ profile, onApply }) {
  const [messages, setMessages] = useState([GREETING])
  const [input, setInput] = useState('')
  const [busy, setBusy] = useState(false)
  const [pending, setPending] = useState(null) // proposed { changes } awaiting approval
  const [remaining, setRemaining] = useState(null)
  const [error, setError] = useState('')
  const scrollRef = useRef(null)
  const firstRender = useRef(true)

  useEffect(() => {
    // Skip the initial mount so entering the page doesn't jump.
    if (firstRender.current) {
      firstRender.current = false
      return
    }
    // Scroll only the chat's own container — not the whole page.
    const el = scrollRef.current
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' })
  }, [messages, pending])

  async function send() {
    const text = input.trim()
    if (!text || busy) return
    setError('')
    setPending(null)
    const history = messages.filter((m) => m.role !== 'system')
    setMessages((m) => [...m, { role: 'user', content: text }])
    setInput('')
    setBusy(true)
    try {
      const { reply, changes, remaining } = await profileChat(profile, text, history)
      setRemaining(remaining)
      setMessages((m) => [...m, { role: 'assistant', content: reply }])
      if (changes) setPending(changes)
    } catch (err) {
      setError(err.message || 'The assistant could not respond.')
    } finally {
      setBusy(false)
    }
  }

  async function approve() {
    const merged = { ...profile, ...pending } // shallow top-level merge of changed sections
    setPending(null)
    try {
      await onApply(merged)
      setMessages((m) => [...m, { role: 'system', content: '✓ Changes saved to your profile.' }])
    } catch (err) {
      setError(err.message || 'Could not save the changes.')
    }
  }

  function dismiss() {
    setPending(null)
    setMessages((m) => [...m, { role: 'system', content: 'Change dismissed.' }])
  }

  return (
    <div className="glass flex h-[640px] flex-col rounded-2xl">
      <div className="flex items-center gap-2 border-b border-[var(--color-border)] px-4 py-3">
        <Sparkles className="h-4 w-4 text-emerald-300" />
        <span className="text-sm font-semibold text-white">Profile assistant</span>
        {remaining != null && (
          <span className="ml-auto text-xs text-[var(--color-muted)]">
            {remaining} left today
          </span>
        )}
      </div>

      <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto p-4">
        {messages.map((m, i) => (
          <Bubble key={i} role={m.role} content={m.content} />
        ))}

        {pending && (
          <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-4">
            <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-emerald-300">
              Proposed change — review &amp; approve
            </p>
            <div className="max-h-56 overflow-y-auto rounded-lg bg-black/30 p-3">
              <ProfileView data={pending} />
            </div>
            <div className="mt-3 flex gap-2">
              <button
                onClick={approve}
                className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-500 px-3 py-1.5 text-sm font-semibold text-black transition hover:brightness-110"
              >
                <Check className="h-4 w-4" /> Apply
              </button>
              <button
                onClick={dismiss}
                className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--color-border)] px-3 py-1.5 text-sm text-white/90 transition hover:bg-white/5"
              >
                <X className="h-4 w-4" /> Dismiss
              </button>
            </div>
          </div>
        )}

        {busy && (
          <div className="flex items-center gap-2 text-sm text-[var(--color-muted)]">
            <Loader2 className="h-4 w-4 animate-spin" /> Thinking…
          </div>
        )}
        {error && <p className="text-sm text-red-300">{error}</p>}
      </div>

      <div className="flex items-center gap-2 border-t border-[var(--color-border)] p-3">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && send()}
          placeholder="Ask me to change something…"
          className="flex-1 rounded-xl border border-[var(--color-border)] bg-black/40 px-4 py-2.5 text-sm text-white outline-none transition focus:border-blue-500/60"
        />
        <button
          onClick={send}
          disabled={busy || !input.trim()}
          className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-blue-500 to-emerald-500 text-white transition hover:brightness-110 disabled:opacity-50"
        >
          <Send className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}

function Bubble({ role, content }) {
  if (role === 'system') {
    return (
      <p className="text-center text-xs text-[var(--color-muted)]">{content}</p>
    )
  }
  const isUser = role === 'user'
  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`max-w-[85%] rounded-2xl px-3.5 py-2 text-sm ${
          isUser
            ? 'bg-blue-500/20 text-white'
            : 'border border-[var(--color-border)] bg-black/30 text-white/90'
        }`}
      >
        {content}
      </div>
    </div>
  )
}
