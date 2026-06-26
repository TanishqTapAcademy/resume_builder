// The real no-login demo: bring a resume -> build a profile IN THE BROWSER -> paste a
// JD -> get ONE tailored resume. Everything is browser-held; nothing is saved on our
// side. One free per IP — after that (or if rate-limited) we nudge to sign up.

import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { Upload, FileCode, Loader2, ArrowRight, Download, Lock, Sparkles } from 'lucide-react'

import {
  demoExtractLatex,
  demoExtractPdf,
  demoGenerate,
  demoStatus,
} from '../../services/api'
import { ShimmerButton } from '../ui/shimmer-button'

export default function DemoWidget() {
  const [step, setStep] = useState('seed') // seed | jd | result
  const [profile, setProfile] = useState(null)
  const [template, setTemplate] = useState(null) // pasted LaTeX, used as template
  const [jd, setJd] = useState('')
  const [pdfUrl, setPdfUrl] = useState(null)
  const [warning, setWarning] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [locked, setLocked] = useState(false)
  const urlRef = useRef(null)

  useEffect(() => {
    demoStatus().then((s) => setLocked(!!s.used))
    return () => {
      if (urlRef.current) URL.revokeObjectURL(urlRef.current)
    }
  }, [])

  function fail(err) {
    if (err?.status === 403 || err?.status === 429) setLocked(true)
    else setError(err?.message || 'Something went wrong.')
    setBusy(false)
  }

  async function handlePdf(file) {
    if (!file) return
    setError('')
    setBusy(true)
    try {
      const p = await demoExtractPdf(file)
      setProfile(p)
      setTemplate(null)
      setStep('jd')
    } catch (err) {
      fail(err)
    } finally {
      setBusy(false)
    }
  }

  async function handleLatex(code) {
    setError('')
    setBusy(true)
    try {
      const p = await demoExtractLatex(code)
      setProfile(p)
      setTemplate(code)
      setStep('jd')
    } catch (err) {
      fail(err)
    } finally {
      setBusy(false)
    }
  }

  async function handleGenerate() {
    if (!jd.trim()) return
    setError('')
    setBusy(true)
    try {
      const { blob, warning: w } = await demoGenerate(profile, jd, template)
      const url = URL.createObjectURL(blob)
      if (urlRef.current) URL.revokeObjectURL(urlRef.current)
      urlRef.current = url
      setPdfUrl(url)
      setWarning(w)
      setStep('result')
    } catch (err) {
      fail(err)
    } finally {
      setBusy(false)
    }
  }

  function download() {
    if (!pdfUrl) return
    const a = document.createElement('a')
    a.href = pdfUrl
    a.download = 'resume.pdf'
    a.click()
  }

  if (locked) return <Locked />

  return (
    <div className="glass relative mx-auto max-w-3xl overflow-hidden rounded-3xl p-6 shadow-2xl ring-1 ring-white/10 sm:p-8">
      <Steps step={step} />

      {step === 'seed' && <SeedStep onPdf={handlePdf} onLatex={handleLatex} busy={busy} />}

      {step === 'jd' && (
        <div className="space-y-3">
          <p className="text-sm text-[var(--color-muted)]">
            Profile ready ✓ Now paste a job description.
          </p>
          <textarea
            value={jd}
            onChange={(e) => setJd(e.target.value)}
            placeholder="Paste the job description…"
            className="h-40 w-full resize-none rounded-xl border border-[var(--color-border)] bg-black/40 p-4 text-sm text-white/90 placeholder:text-[var(--color-muted)] outline-none focus:border-blue-500/60"
          />
          <div className="flex justify-center">
            <ShimmerButton
              background="rgba(16,185,129,0.18)"
              className="px-6 py-3 text-base font-semibold"
              onClick={handleGenerate}
              disabled={busy || !jd.trim()}
            >
              {busy ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  Generate my resume <ArrowRight className="ml-2 h-4 w-4" />
                </>
              )}
            </ShimmerButton>
          </div>
        </div>
      )}

      {step === 'result' && (
        <div className="space-y-4">
          <div className="h-[420px] overflow-hidden rounded-xl border border-[var(--color-border)]">
            {/* Hide the browser PDF viewer chrome — show just the document. */}
            <iframe
              title="demo resume"
              src={`${pdfUrl}#toolbar=0&navpanes=0&scrollbar=0&view=FitH`}
              className="h-full w-full bg-white"
            />
          </div>
          {warning && <p className="text-center text-xs text-amber-200">{warning}</p>}
          <div className="flex flex-col items-center gap-3">
            <button
              onClick={download}
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-500 to-emerald-500 px-5 py-2.5 font-semibold text-white transition hover:brightness-110"
            >
              <Download className="h-4 w-4" /> Download PDF
            </button>
            <p className="text-sm text-[var(--color-muted)]">
              That’s your free one.{' '}
              <Link to="/signup" className="font-medium text-blue-300 hover:text-blue-200">
                Sign up
              </Link>{' '}
              to save it and tailor unlimited resumes.
            </p>
          </div>
        </div>
      )}

      {busy && step === 'seed' && (
        <p className="mt-4 flex items-center justify-center gap-2 text-sm text-emerald-300">
          <Loader2 className="h-4 w-4 animate-spin" /> Reading your resume…
        </p>
      )}
      {error && <p className="mt-4 text-center text-sm text-red-300">{error}</p>}
    </div>
  )
}

function Steps({ step }) {
  const order = ['seed', 'jd', 'result']
  const labels = { seed: 'Your resume', jd: 'The job', result: 'Tailored PDF' }
  const idx = order.indexOf(step)
  return (
    <div className="mb-6 flex items-center justify-center gap-2 text-xs">
      {order.map((s, i) => (
        <div key={s} className="flex items-center gap-2">
          <span
            className={`flex items-center gap-1.5 rounded-full px-3 py-1 ${
              i <= idx
                ? 'bg-blue-500/15 text-blue-200'
                : 'text-[var(--color-muted)]'
            }`}
          >
            <span
              className={`grid h-4 w-4 place-items-center rounded-full text-[10px] ${
                i <= idx ? 'bg-blue-500 text-white' : 'bg-white/10'
              }`}
            >
              {i + 1}
            </span>
            {labels[s]}
          </span>
          {i < order.length - 1 && <span className="text-[var(--color-muted)]">→</span>}
        </div>
      ))}
    </div>
  )
}

function SeedStep({ onPdf, onLatex, busy }) {
  const fileRef = useRef(null)
  const [latex, setLatex] = useState('')
  const [mode, setMode] = useState('pdf') // pdf | latex

  return (
    <div>
      <div className="mb-4 flex justify-center gap-2">
        <Toggle active={mode === 'pdf'} onClick={() => setMode('pdf')} icon={Upload}>
          Upload PDF
        </Toggle>
        <Toggle active={mode === 'latex'} onClick={() => setMode('latex')} icon={FileCode}>
          Paste LaTeX
        </Toggle>
      </div>

      {mode === 'pdf' ? (
        <div
          onClick={() => !busy && fileRef.current?.click()}
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault()
            if (!busy) onPdf(e.dataTransfer.files?.[0])
          }}
          className="grid cursor-pointer place-items-center rounded-xl border-2 border-dashed border-[var(--color-border)] bg-black/30 px-6 py-12 text-center transition hover:border-blue-500/50"
        >
          <Upload className="mb-3 h-7 w-7 text-blue-300" />
          <p className="text-sm font-medium text-white">Drop your resume PDF, or click</p>
          <p className="mt-1 text-xs text-[var(--color-muted)]">No signup needed</p>
          <input
            ref={fileRef}
            type="file"
            accept="application/pdf"
            className="hidden"
            onChange={(e) => onPdf(e.target.files?.[0])}
          />
        </div>
      ) : (
        <div>
          <textarea
            value={latex}
            onChange={(e) => setLatex(e.target.value)}
            placeholder="Paste your LaTeX resume source…"
            spellCheck={false}
            className="h-40 w-full resize-none rounded-xl border border-[var(--color-border)] bg-black/40 p-4 font-mono text-sm text-white/90 outline-none focus:border-blue-500/60"
          />
          <div className="mt-3 flex justify-center">
            <button
              onClick={() => onLatex(latex)}
              disabled={busy || !latex.trim()}
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-500 to-emerald-500 px-5 py-2.5 text-sm font-semibold text-white transition hover:brightness-110 disabled:opacity-50"
            >
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Build profile'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

function Toggle({ active, onClick, icon: Icon, children }) {
  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition ${
        active ? 'bg-white/10 text-white' : 'text-[var(--color-muted)] hover:text-white'
      }`}
    >
      <Icon className="h-4 w-4" />
      {children}
    </button>
  )
}

function Locked() {
  return (
    <div className="glass mx-auto max-w-xl rounded-3xl p-10 text-center">
      <div className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-2xl bg-gradient-to-br from-blue-500/20 to-emerald-500/20 ring-1 ring-white/10">
        <Lock className="h-6 w-6 text-blue-300" />
      </div>
      <h3 className="text-xl font-semibold text-white">You’ve used your free demo</h3>
      <p className="mx-auto mt-2 max-w-sm text-sm text-[var(--color-muted)]">
        Sign up to save your resume and tailor as many as you want — it’s free.
      </p>
      <div className="mt-6 flex justify-center gap-3">
        <Link to="/signup">
          <ShimmerButton background="rgba(59,130,246,0.18)" className="px-6 py-3 font-semibold">
            <Sparkles className="mr-2 h-4 w-4" /> Sign up free
          </ShimmerButton>
        </Link>
        <Link
          to="/login"
          className="rounded-full border border-[var(--color-border)] px-6 py-3 font-medium text-white/90 transition hover:bg-white/5"
        >
          Log in
        </Link>
      </div>
    </div>
  )
}
