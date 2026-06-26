// Left pane of the Tailor view: JD input -> fit score + gaps -> generate (gated).
// Dumb component — all state/handlers come via props (FRONTEND.md §0 rule 1).

import { useState } from 'react'

const THRESHOLD = 70 // mirrors backend match_threshold (display only)

function ScoreBar({ score, fit }) {
  const color = fit ? 'bg-emerald-400' : 'bg-amber-400'
  return (
    <div>
      <div className="flex items-end justify-between mb-1.5">
        <span className="text-3xl font-semibold tabular-nums">{score}%</span>
        <span
          className={`px-2 py-0.5 text-[11px] font-semibold rounded-full ${
            fit ? 'bg-emerald-400/15 text-emerald-300' : 'bg-amber-400/15 text-amber-300'
          }`}
        >
          {fit ? 'Strong fit' : 'Not yet'}
        </span>
      </div>
      <div className="relative h-2 rounded-full bg-[var(--color-surface-2)] overflow-hidden">
        <div className={`h-full ${color} transition-all`} style={{ width: `${score}%` }} />
        {/* threshold marker */}
        <div className="absolute top-0 bottom-0 w-px bg-white/40" style={{ left: `${THRESHOLD}%` }} />
      </div>
      <p className="mt-1 text-[11px] text-[var(--color-muted)]">{THRESHOLD}% needed to generate</p>
    </div>
  )
}

function GapList({ title, items, tone }) {
  if (!items?.length) return null
  const dot = tone === 'missing' ? 'bg-rose-400' : 'bg-[var(--color-accent-soft)]'
  return (
    <div>
      <h4 className="text-xs font-semibold text-[var(--color-muted)] mb-1.5">{title}</h4>
      <ul className="space-y-1.5">
        {items.map((it, i) => (
          <li key={i} className="flex gap-2 text-[13px] leading-snug">
            <span className={`mt-1.5 w-1.5 h-1.5 rounded-full shrink-0 ${dot}`} />
            <span>{it}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

export default function MatchPanel({
  jd,
  setJd,
  company,
  setCompany,
  match,
  onCheck,
  template,
  setTemplate,
  genStatus,
  onGenerate,
}) {
  const [showTemplate, setShowTemplate] = useState(false)
  const result = match.result
  const fit = result?.fit === true
  const checking = match.status === 'checking'
  const generating = genStatus === 'generating'

  return (
    <section className="glass rounded-2xl flex flex-col min-h-0 overflow-auto">
      <div className="p-5 space-y-5">
        {/* 1. Job description */}
        <div className="space-y-3">
          <h3 className="text-sm font-semibold">1 · Target job</h3>
          <input
            value={company}
            onChange={(e) => setCompany(e.target.value)}
            placeholder="Company (optional)"
            className="w-full px-3 py-2 text-sm rounded-lg bg-[var(--color-surface-2)] border border-[var(--color-border)] focus:border-[var(--color-accent)] outline-none"
          />
          <textarea
            value={jd}
            onChange={(e) => setJd(e.target.value)}
            placeholder="Paste the job description here…"
            rows={6}
            className="w-full px-3 py-2 text-sm rounded-lg bg-[var(--color-surface-2)] border border-[var(--color-border)] focus:border-[var(--color-accent)] outline-none resize-y font-[var(--font-mono)]"
          />
          <button
            onClick={onCheck}
            disabled={checking || !jd.trim()}
            className="w-full py-2 text-sm font-medium rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-2)] hover:border-[var(--color-accent)] hover:text-white transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {checking ? 'Checking fit…' : 'Check fit'}
          </button>
          {match.status === 'error' && (
            <p className="text-[13px] text-rose-400">{match.error}</p>
          )}
        </div>

        {/* 2. Fit result + gaps */}
        {result && (
          <div className="space-y-4 pt-1 border-t border-[var(--color-border)]">
            <div className="pt-4">
              <ScoreBar score={result.score} fit={fit} />
            </div>
            <GapList title="What's missing" items={result.missing} tone="missing" />
            <GapList title="Suggestions" items={result.suggestions} tone="suggest" />
            {!fit && (
              <p className="text-[13px] text-amber-300/90">
                Below the bar. Address the gaps, update your profile, and re-check.
              </p>
            )}
          </div>
        )}

        {/* Reference template (advanced, collapsible) */}
        <div className="pt-1 border-t border-[var(--color-border)]">
          <button
            onClick={() => setShowTemplate((s) => !s)}
            className="pt-4 flex items-center gap-2 text-xs text-[var(--color-muted)] hover:text-white transition"
          >
            <span className={`transition-transform ${showTemplate ? 'rotate-90' : ''}`}>›</span>
            Reference template (the look to mimic)
          </button>
          {showTemplate && (
            <textarea
              value={template}
              onChange={(e) => setTemplate(e.target.value)}
              rows={8}
              className="mt-2 w-full px-3 py-2 text-[12px] rounded-lg bg-[var(--color-surface-2)] border border-[var(--color-border)] focus:border-[var(--color-accent)] outline-none resize-y font-[var(--font-mono)]"
            />
          )}
        </div>

        {/* 3. Generate (gated on fit) */}
        <div className="pt-1 border-t border-[var(--color-border)]">
          <h3 className="pt-4 text-sm font-semibold mb-2">2 · Generate</h3>
          <button
            onClick={onGenerate}
            disabled={!fit || generating}
            className="w-full py-2.5 text-sm font-semibold rounded-lg bg-[var(--color-accent)] text-white shadow-[0_0_24px_-4px_var(--color-accent)] hover:brightness-110 transition disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none"
          >
            {generating ? 'Generating…' : 'Generate tailored resume'}
          </button>
          {!fit && (
            <p className="mt-2 text-[12px] text-[var(--color-muted)]">
              Unlocks once your fit reaches {THRESHOLD}%.
            </p>
          )}
        </div>
      </div>
    </section>
  )
}
