// The real dashboard: paste a JD -> check fit (required) -> generate a tailored one-page
// resume from the user's stored profile + template -> preview & download.
// Company isn't asked for — the job description carries the signal.

import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Target, Wand2, Loader2, FileWarning, RefreshCw, FileUser } from 'lucide-react'

import { getProfile } from '../services/api'
import { WEAK_FLOOR } from '../config'
import { useMatch } from '../hooks/useMatch'
import { useGenerate } from '../hooks/useGenerate'
import SpaceBackground from '../components/space/SpaceBackground'
import AppHeader from '../components/AppHeader'
import MatchResult from '../components/dashboard/MatchResult'
import ResumePreview from '../components/dashboard/ResumePreview'

// A profile is "ready" only when it has the basics: a name AND at least one real
// section (summary/experience/skills/projects/education). An empty shell doesn't count.
function isProfileReady(data) {
  if (!data || typeof data !== 'object') return false
  const name = (data.contact?.name || data.contact?.fullName || data.name || '').trim()
  const filled = (v) =>
    Array.isArray(v)
      ? v.length > 0
      : typeof v === 'string'
        ? v.trim() !== ''
        : !!v && typeof v === 'object' && Object.keys(v).length > 0
  const hasContent = ['summary', 'experience', 'skills', 'projects', 'education'].some(
    (k) => filled(data[k]),
  )
  return name !== '' && hasContent
}

export default function Dashboard() {
  const [jd, setJd] = useState('')
  const [hasProfile, setHasProfile] = useState(null) // null = checking
  const [checkedKey, setCheckedKey] = useState(null) // which jd the score is for
  const [filename, setFilename] = useState('resume') // editable download name

  const match = useMatch()
  const gen = useGenerate()

  useEffect(() => {
    getProfile()
      .then((p) => setHasProfile(isProfileReady(p?.data)))
      .catch(() => setHasProfile(false)) // can't confirm readiness -> require setup
  }, [])

  function handleDownload() {
    if (!gen.pdfUrl) return
    // Strip characters illegal in filenames; fall back to "resume".
    const safe = (filename.trim() || 'resume').replace(/[/\\:*?"<>|]+/g, '')
    const a = document.createElement('a')
    a.href = gen.pdfUrl
    a.download = `${safe}.pdf`
    a.click()
  }

  const profileReady = hasProfile === true
  const busy = match.status === 'checking' || gen.status === 'generating'
  const currentKey = jd.trim()

  // A fit check is REQUIRED before generating, and it must match the current JD.
  const isDone = match.status === 'done'
  const stale = isDone && checkedKey !== currentKey // JD edited since the check
  const freshResult = isDone && !stale ? match.result : null
  const score = freshResult?.score ?? null

  function runCheck() {
    if (!jd.trim() || !profileReady || busy) return
    setCheckedKey(currentKey)
    match.checkFit(jd)
  }

  const canCheck = jd.trim().length > 0 && profileReady && !busy
  // Generate only after a fresh check that scores at or above the weak floor.
  const canGenerate = profileReady && freshResult != null && score >= WEAK_FLOOR && !busy

  // Progressive disclosure of the action buttons:
  //   no fresh score      -> only the (highlighted) Check button
  //   fresh & score >= 20  -> Generate + Re-check
  //   fresh & score < 20   -> Update-profile redirect + Re-check
  const showGenerate = freshResult != null && score >= WEAK_FLOOR
  const showUpdateProfile = freshResult != null && score < WEAK_FLOOR
  const showOnlyCheck = freshResult == null

  return (
    <div className="relative min-h-screen pb-16">
      <SpaceBackground />
      <AppHeader />

      <main className="mx-auto max-w-6xl px-4 py-10">
        <div className="mb-6">
          <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
            Tailor a resume
          </h1>
          <p className="mt-1 text-[var(--color-muted)]">Paste a job. Check fit. Generate.</p>
        </div>

        {hasProfile === false && (
          <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-amber-500/30 bg-amber-500/10 px-5 py-4">
            <p className="flex items-center gap-2 text-sm text-amber-200">
              <FileWarning className="h-4 w-4" />
              Finish your profile first — at least your name and some experience or skills.
            </p>
            <Link
              to="/profile"
              className="rounded-lg bg-amber-500 px-3 py-1.5 text-sm font-semibold text-black transition hover:brightness-110"
            >
              Set up profile
            </Link>
          </div>
        )}

        <div className="grid gap-6 lg:grid-cols-[1fr_1.1fr]">
          {/* Left: form + match */}
          <div className="space-y-5">
            <div className="glass space-y-4 rounded-2xl p-5">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-white">
                  Job description
                </label>
                <textarea
                  value={jd}
                  onChange={(e) => setJd(e.target.value)}
                  placeholder="Paste the full job description here…"
                  className="h-72 w-full resize-none rounded-xl border border-[var(--color-border)] bg-black/40 p-4 text-sm text-white/90 placeholder:text-[var(--color-muted)] outline-none transition focus:border-blue-500/60"
                />
              </div>

              {/* Step 1 — only the highlighted Check button until a score exists */}
              {showOnlyCheck && (
                <button
                  onClick={runCheck}
                  disabled={!canCheck}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-500 to-emerald-500 px-5 py-3 text-sm font-semibold text-white shadow-[0_0_34px_-6px_rgba(59,130,246,0.8)] transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-40 disabled:shadow-none"
                >
                  {match.status === 'checking' ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" /> Checking your fit…
                    </>
                  ) : (
                    <>
                      <Target className="h-4 w-4" /> {stale ? 'Re-check my fit' : 'Check my fit'}
                    </>
                  )}
                </button>
              )}

              {/* Step 2a — strong/partial fit: generation unlocked */}
              {showGenerate && (
                <div className="flex flex-wrap gap-3">
                  <button
                    onClick={() => gen.generate(jd, score)}
                    disabled={!canGenerate}
                    className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-500 to-emerald-500 px-5 py-3 text-sm font-semibold text-white shadow-[0_0_34px_-6px_rgba(59,130,246,0.8)] transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    {gen.status === 'generating' ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" /> Tailoring…
                      </>
                    ) : (
                      <>
                        <Wand2 className="h-4 w-4" /> Generate resume
                      </>
                    )}
                  </button>
                  <button
                    onClick={runCheck}
                    disabled={!canCheck}
                    className="inline-flex items-center gap-2 rounded-xl border border-[var(--color-border)] px-4 py-3 text-sm font-medium text-white/90 transition hover:bg-white/5 disabled:opacity-50"
                  >
                    <RefreshCw className="h-4 w-4" /> Re-check
                  </button>
                </div>
              )}

              {/* Step 2b — below the floor: send them to improve their profile */}
              {showUpdateProfile && (
                <div className="space-y-2">
                  <p className="text-sm text-red-300">
                    This role needs experience or skills your profile doesn’t show yet.
                    Update your profile for this role, then re-check.
                  </p>
                  <div className="flex flex-wrap gap-3">
                    <Link
                      to="/profile"
                      className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-500 to-emerald-500 px-5 py-3 text-sm font-semibold text-white shadow-[0_0_34px_-6px_rgba(59,130,246,0.8)] transition hover:brightness-110"
                    >
                      <FileUser className="h-4 w-4" /> Update profile for this role
                    </Link>
                    <button
                      onClick={runCheck}
                      disabled={!canCheck}
                      className="inline-flex items-center gap-2 rounded-xl border border-[var(--color-border)] px-4 py-3 text-sm font-medium text-white/90 transition hover:bg-white/5 disabled:opacity-50"
                    >
                      <RefreshCw className="h-4 w-4" /> Re-check
                    </button>
                  </div>
                </div>
              )}
            </div>

            <MatchResult match={match} stale={stale} />
          </div>

          {/* Right: preview */}
          <ResumePreview
            gen={gen}
            onDownload={handleDownload}
            filename={filename}
            onFilenameChange={setFilename}
          />
        </div>
      </main>
    </div>
  )
}
