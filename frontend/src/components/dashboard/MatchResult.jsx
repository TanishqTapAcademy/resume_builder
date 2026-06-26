// Fit-score panel: animated score bar, fit/gap badge, missing items, and suggestions.
// Driven entirely by the useMatch hook's state.

import { motion } from 'motion/react'
import { Loader2, CheckCircle2, AlertTriangle, Lightbulb, XCircle, RefreshCw } from 'lucide-react'

import { STRONG_FIT, WEAK_FLOOR } from '../../config'

// Map a score to its band: visuals + label for the three-tier gate.
function band(score) {
  if (score >= STRONG_FIT)
    return { tone: 'emerald', label: 'strong fit', Icon: CheckCircle2, bar: 'from-blue-500 to-emerald-400', chip: 'bg-emerald-500/15 text-emerald-300' }
  if (score >= WEAK_FLOOR)
    return { tone: 'amber', label: 'partial fit', Icon: AlertTriangle, bar: 'from-amber-500 to-amber-300', chip: 'bg-amber-500/15 text-amber-300' }
  return { tone: 'red', label: 'not a match', Icon: XCircle, bar: 'from-red-500 to-red-400', chip: 'bg-red-500/15 text-red-300' }
}

export default function MatchResult({ match, stale }) {
  if (match.status === 'idle') return null

  if (match.status === 'checking') {
    return (
      <div className="glass flex items-center gap-2 rounded-2xl p-5 text-sm text-[var(--color-muted)]">
        <Loader2 className="h-4 w-4 animate-spin" /> Scoring your fit for this role…
      </div>
    )
  }

  if (match.status === 'error') {
    return (
      <div className="glass rounded-2xl p-5 text-sm text-red-300">{match.error}</div>
    )
  }

  // A previous score exists but the JD/company changed — it no longer applies.
  if (stale) {
    return (
      <div className="glass flex items-center gap-2 rounded-2xl p-5 text-sm text-amber-200">
        <RefreshCw className="h-4 w-4" /> Job description changed — re-check fit to continue.
      </div>
    )
  }

  const { score, missing, suggestions } = match.result
  const b = band(score)

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass space-y-5 rounded-2xl p-5"
    >
      <div>
        <div className="mb-2 flex items-center justify-between">
          <span className="text-xs uppercase tracking-widest text-[var(--color-muted)]">
            Match score
          </span>
          <span className={`flex items-center gap-1.5 rounded-full px-2.5 py-1 text-sm font-semibold ${b.chip}`}>
            <b.Icon className="h-4 w-4" />
            {score}% {b.label}
          </span>
        </div>
        <div className="h-2.5 w-full overflow-hidden rounded-full bg-white/10">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${score}%` }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
            className={`h-full rounded-full bg-gradient-to-r ${b.bar}`}
          />
        </div>
      </div>

      {missing?.length > 0 && (
        <div>
          <p className="mb-2 flex items-center gap-1.5 text-sm font-medium text-white">
            <AlertTriangle className="h-4 w-4 text-amber-300" /> Gaps for this role
          </p>
          <div className="flex flex-wrap gap-2">
            {missing.map((m, i) => (
              <span
                key={i}
                className="rounded-md bg-amber-500/10 px-2.5 py-1 text-xs text-amber-200 ring-1 ring-inset ring-amber-500/20"
              >
                {m}
              </span>
            ))}
          </div>
        </div>
      )}

      {suggestions?.length > 0 && (
        <div>
          <p className="mb-2 flex items-center gap-1.5 text-sm font-medium text-white">
            <Lightbulb className="h-4 w-4 text-blue-300" /> Suggestions
          </p>
          <ul className="space-y-1.5">
            {suggestions.map((s, i) => (
              <li key={i} className="flex gap-2 text-sm text-[var(--color-muted)]">
                <span className="text-blue-300">•</span>
                {s}
              </li>
            ))}
          </ul>
        </div>
      )}
    </motion.div>
  )
}
