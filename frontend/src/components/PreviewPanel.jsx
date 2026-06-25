// Right pane: the live PDF preview. Handles every state (FRONTEND.md §0 rule 7):
// idle / compiling / success (PDF) / error (LaTeX log).

function Spinner() {
  return (
    <span className="inline-block w-4 h-4 rounded-full border-2 border-[var(--color-accent-soft)] border-t-transparent animate-spin" />
  )
}

export default function PreviewPanel({ status, pdfUrl, error }) {
  const compiling = status === 'compiling'

  return (
    <section className="glass rounded-2xl overflow-hidden flex flex-col min-h-0">
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-[var(--color-border)]">
        <span className="text-xs text-[var(--color-muted)] font-[var(--font-mono)]">
          preview.pdf
        </span>
        {compiling && (
          <span className="flex items-center gap-2 text-xs text-[var(--color-accent-soft)]">
            <Spinner /> rendering
          </span>
        )}
      </div>

      <div className="relative flex-1 min-h-0 bg-[#0f0f17]">
        {/* The PDF itself (kept mounted across recompiles for a smooth feel) */}
        {pdfUrl && status !== 'error' && (
          <iframe
            title="PDF preview"
            src={`${pdfUrl}#toolbar=0&navpanes=0&view=FitH`}
            className="w-full h-full"
          />
        )}

        {/* First-load / empty state */}
        {!pdfUrl && status !== 'error' && (
          <div className="absolute inset-0 grid place-items-center text-center px-6">
            <div className="text-[var(--color-muted)]">
              {compiling ? (
                <p className="flex items-center gap-2">
                  <Spinner /> Compiling your resume…
                </p>
              ) : (
                <p className="text-sm">Your compiled PDF will appear here.</p>
              )}
            </div>
          </div>
        )}

        {/* Error state — show the LaTeX log */}
        {status === 'error' && (
          <div className="absolute inset-0 overflow-auto p-5">
            <div className="flex items-center gap-2 mb-3 text-rose-400 text-sm font-medium">
              <span className="w-2 h-2 rounded-full bg-rose-400" />
              {error?.message ?? 'Compilation failed'}
            </div>
            {error?.log && (
              <pre className="text-[12px] leading-relaxed text-rose-200/80 font-[var(--font-mono)] whitespace-pre-wrap bg-rose-500/5 border border-rose-500/20 rounded-xl p-4">
                {error.log}
              </pre>
            )}
          </div>
        )}
      </div>
    </section>
  )
}
