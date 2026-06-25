// Top bar: brand + live status pill + Compile and Download actions.
// Dumb component (FRONTEND.md §0 rule 1) — receives state and callbacks via props.

const STATUS_META = {
  idle: { label: 'Ready', dot: 'bg-[var(--color-muted)]' },
  compiling: { label: 'Compiling…', dot: 'bg-[var(--color-accent-soft)] animate-pulse' },
  success: { label: 'Up to date', dot: 'bg-emerald-400' },
  error: { label: 'Error', dot: 'bg-rose-400' },
}

export default function Header({ status, canDownload, onCompile, onDownload }) {
  const meta = STATUS_META[status] ?? STATUS_META.idle

  return (
    <header className="flex items-center justify-between px-5 py-3 border-b border-[var(--color-border)]">
      {/* Brand */}
      <div className="flex items-center gap-2.5">
        <div className="grid place-items-center w-8 h-8 rounded-lg bg-[var(--color-accent)] shadow-[0_0_20px_-2px_var(--color-accent)]">
          <span className="text-sm font-bold text-white">R</span>
        </div>
        <div className="leading-tight">
          <h1 className="text-sm font-semibold tracking-tight">Resume Builder</h1>
          <p className="text-[11px] text-[var(--color-muted)]">LaTeX · live preview</p>
        </div>
      </div>

      {/* Status + actions */}
      <div className="flex items-center gap-3">
        <span className="flex items-center gap-2 text-xs text-[var(--color-muted)]">
          <span className={`w-1.5 h-1.5 rounded-full ${meta.dot}`} />
          {meta.label}
        </span>

        <button
          onClick={onCompile}
          disabled={status === 'compiling'}
          className="px-3.5 py-1.5 text-xs font-medium rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-2)] hover:border-[var(--color-accent)] hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Compile
        </button>

        <button
          onClick={onDownload}
          disabled={!canDownload}
          className="px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-[var(--color-accent)] text-white shadow-[0_0_24px_-4px_var(--color-accent)] hover:brightness-110 transition disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none"
        >
          Download PDF
        </button>
      </div>
    </header>
  )
}
