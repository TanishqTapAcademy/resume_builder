// Right pane: the PDF preview. Reused by both views (FRONTEND.md §0 rule 1 — dumb).
// Handles every state: empty / busy / pdf (+ optional warning) / error (log).

function Spinner() {
  return (
    <span className="inline-block w-4 h-4 rounded-full border-2 border-[var(--color-accent-soft)] border-t-transparent animate-spin" />
  )
}

export default function PreviewPanel({
  busy = false,
  pdfUrl = null,
  error = null,
  warning = '',
  emptyHint = 'Your compiled PDF will appear here.',
  label = 'preview.pdf',
  onDownload = null,
}) {
  const isError = Boolean(error)
  const showPdf = pdfUrl && !isError

  return (
    <section className="glass rounded-2xl overflow-hidden flex flex-col min-h-0">
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-[var(--color-border)]">
        <span className="text-xs text-[var(--color-muted)] font-[var(--font-mono)]">{label}</span>
        <div className="flex items-center gap-3">
          {busy && (
            <span className="flex items-center gap-2 text-xs text-[var(--color-accent-soft)]">
              <Spinner /> rendering
            </span>
          )}
          {showPdf && onDownload && (
            <button
              onClick={onDownload}
              className="px-3 py-1 text-xs font-semibold rounded-lg bg-[var(--color-accent)] text-white shadow-[0_0_24px_-4px_var(--color-accent)] hover:brightness-110 transition"
            >
              Download PDF
            </button>
          )}
        </div>
      </div>

      {warning && showPdf && (
        <div className="px-4 py-2 text-[12px] text-amber-200/90 bg-amber-500/10 border-b border-amber-500/20">
          ⚠ {warning}
        </div>
      )}

      <div className="relative flex-1 min-h-0 bg-[#0f0f17]">
        {showPdf && (
          <iframe
            title="PDF preview"
            src={`${pdfUrl}#toolbar=0&navpanes=0&view=FitH`}
            className="w-full h-full"
          />
        )}

        {!showPdf && !isError && (
          <div className="absolute inset-0 grid place-items-center text-center px-6">
            <div className="text-[var(--color-muted)]">
              {busy ? (
                <p className="flex items-center gap-2">
                  <Spinner /> Working…
                </p>
              ) : (
                <p className="text-sm">{emptyHint}</p>
              )}
            </div>
          </div>
        )}

        {isError && (
          <div className="absolute inset-0 overflow-auto p-5">
            <div className="flex items-center gap-2 mb-3 text-rose-400 text-sm font-medium">
              <span className="w-2 h-2 rounded-full bg-rose-400" />
              {error?.message ?? 'Something went wrong'}
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
