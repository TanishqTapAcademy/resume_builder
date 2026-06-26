// First-time profile setup — exactly two doors: upload a resume PDF, or paste LaTeX.
// Both go through the backend (parse/extract -> AI -> profile). On success we hand the
// saved profile back up to the page.

import { useRef, useState } from 'react'
import { motion } from 'motion/react'
import { Upload, FileCode, Loader2, ArrowLeft } from 'lucide-react'

import { seedProfileLatex, seedProfilePdf } from '../../services/api'

export default function ProfileSeed({ onSeeded }) {
  const [door, setDoor] = useState(null) // null | 'pdf' | 'latex'

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold tracking-tight text-white">
          Build your <span className="text-gradient">profile</span>
        </h1>
        <p className="mt-3 text-[var(--color-muted)]">Bring your resume — pick one.</p>
      </div>

      {door === null && (
        <div className="grid gap-5 sm:grid-cols-2">
          <DoorCard
            icon={Upload}
            title="Upload a PDF"
            body="We extract and structure it."
            onClick={() => setDoor('pdf')}
          />
          <DoorCard
            icon={FileCode}
            title="Paste LaTeX"
            body="Also saved as your template."
            onClick={() => setDoor('latex')}
          />
        </div>
      )}

      {door === 'pdf' && <PdfDoor onBack={() => setDoor(null)} onSeeded={onSeeded} />}
      {door === 'latex' && <LatexDoor onBack={() => setDoor(null)} onSeeded={onSeeded} />}
    </div>
  )
}

function DoorCard({ icon: Icon, title, body, onClick }) {
  return (
    <motion.button
      whileHover={{ y: -4 }}
      onClick={onClick}
      className="glass group relative overflow-hidden rounded-2xl p-6 text-left transition hover:border-blue-500/40"
    >
      <div className="absolute -right-12 -top-12 h-32 w-32 rounded-full bg-blue-500/10 blur-2xl transition group-hover:bg-emerald-500/15" />
      <div className="relative mb-4 grid h-12 w-12 place-items-center rounded-xl bg-gradient-to-br from-blue-500/20 to-emerald-500/20 ring-1 ring-white/10">
        <Icon className="h-6 w-6 text-blue-300" />
      </div>
      <h3 className="relative mb-2 text-lg font-semibold text-white">{title}</h3>
      <p className="relative text-sm leading-relaxed text-[var(--color-muted)]">{body}</p>
    </motion.button>
  )
}

function BackBtn({ onBack }) {
  return (
    <button
      onClick={onBack}
      className="mb-4 inline-flex items-center gap-1.5 text-sm text-[var(--color-muted)] transition hover:text-white"
    >
      <ArrowLeft className="h-4 w-4" /> Back
    </button>
  )
}

function Building({ label }) {
  return (
    <div className="mt-4 flex items-center justify-center gap-2 text-sm text-emerald-300">
      <Loader2 className="h-4 w-4 animate-spin" />
      {label}
    </div>
  )
}

function PdfDoor({ onBack, onSeeded }) {
  const inputRef = useRef(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [fileName, setFileName] = useState('')

  async function handleFile(file) {
    if (!file) return
    setFileName(file.name)
    setError('')
    setBusy(true)
    try {
      const profile = await seedProfilePdf(file)
      onSeeded(profile)
    } catch (err) {
      setError(err.message || 'Could not read that PDF.')
      setBusy(false)
    }
  }

  return (
    <div className="glass rounded-2xl p-6">
      <BackBtn onBack={onBack} />
      <div
        onClick={() => !busy && inputRef.current?.click()}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault()
          if (!busy) handleFile(e.dataTransfer.files?.[0])
        }}
        className="grid cursor-pointer place-items-center rounded-xl border-2 border-dashed border-[var(--color-border)] bg-black/30 px-6 py-14 text-center transition hover:border-blue-500/50"
      >
        <Upload className="mb-3 h-8 w-8 text-blue-300" />
        <p className="font-medium text-white">
          {fileName || 'Drop your resume PDF here, or click to browse'}
        </p>
        <p className="mt-1 text-xs text-[var(--color-muted)]">PDF, up to 5 MB</p>
        <input
          ref={inputRef}
          type="file"
          accept="application/pdf"
          className="hidden"
          onChange={(e) => handleFile(e.target.files?.[0])}
        />
      </div>
      {busy && <Building label="Reading your resume and building your profile…" />}
      {error && <p className="mt-4 text-sm text-red-300">{error}</p>}
    </div>
  )
}

function LatexDoor({ onBack, onSeeded }) {
  const [code, setCode] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  async function submit() {
    if (!code.trim()) return
    setError('')
    setBusy(true)
    try {
      const profile = await seedProfileLatex(code)
      onSeeded(profile)
    } catch (err) {
      setError(err.message || 'Could not build a profile from that LaTeX.')
      setBusy(false)
    }
  }

  return (
    <div className="glass rounded-2xl p-6">
      <BackBtn onBack={onBack} />
      <textarea
        value={code}
        onChange={(e) => setCode(e.target.value)}
        placeholder="Paste your full LaTeX resume source here…"
        spellCheck={false}
        className="h-72 w-full resize-none rounded-xl border border-[var(--color-border)] bg-black/40 p-4 font-mono text-sm text-white/90 outline-none transition focus:border-blue-500/60"
      />
      <div className="mt-4 flex items-center justify-between">
        <p className="text-xs text-[var(--color-muted)]">
          We’ll also keep this as your resume template.
        </p>
        <button
          onClick={submit}
          disabled={busy || !code.trim()}
          className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-500 to-emerald-500 px-5 py-2.5 font-semibold text-white transition hover:brightness-110 disabled:opacity-50"
        >
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Build profile'}
        </button>
      </div>
      {busy && <Building label="Extracting your profile from the LaTeX…" />}
      {error && <p className="mt-4 text-sm text-red-300">{error}</p>}
    </div>
  )
}
