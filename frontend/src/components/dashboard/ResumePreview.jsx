// Right-hand panel: the generated PDF preview + download, with all states (idle,
// generating, success+warning, error+log). The preview area is page-shaped (8.5×11) so
// a full one-page resume always fits at any width; a 2-page result scrolls inside it.

import { useState } from 'react'
import { Download, FileText, AlertTriangle, ChevronDown, Pencil } from 'lucide-react'

import GeneratingLoader from './GeneratingLoader'

export default function ResumePreview({
  gen,
  onDownload,
  onEdit,
  filename,
  onFilenameChange,
  fill = false, // fill: stretch to the column height + scroll the PDF internally (edit mode)
}) {
  const [showLog, setShowLog] = useState(false)
  const success = gen.status === 'success'

  return (
    <div
      className={`glass flex flex-col overflow-hidden rounded-2xl ${fill ? 'h-full min-h-0' : ''}`}
    >
      <div className="flex items-center justify-between gap-3 border-b border-[var(--color-border)] px-4 py-3">
        {success ? (
          // Editable filename — click to rename; used as the download name.
          <label className="group flex min-w-0 flex-1 items-center gap-2 text-sm font-semibold text-white">
            <FileText className="h-4 w-4 shrink-0 text-blue-300" />
            <span className="flex min-w-0 items-center rounded-md px-1.5 py-1 ring-1 ring-inset ring-transparent transition focus-within:bg-black/40 focus-within:ring-blue-500/50 hover:ring-white/10">
              <input
                value={filename}
                onChange={(e) => onFilenameChange(e.target.value)}
                placeholder="resume"
                aria-label="File name"
                className="min-w-0 max-w-[12rem] bg-transparent text-right outline-none"
                size={Math.max((filename || 'resume').length, 4)}
              />
              <span className="text-[var(--color-muted)]">.pdf</span>
              <Pencil className="ml-1.5 h-3 w-3 shrink-0 text-[var(--color-muted)] opacity-0 transition group-hover:opacity-100" />
            </span>
          </label>
        ) : (
          <span className="flex items-center gap-2 text-sm font-semibold text-white">
            <FileText className="h-4 w-4 text-blue-300" /> Tailored resume
          </span>
        )}
        {success && (
          <div className="flex shrink-0 items-center gap-2">
            {onEdit && (
              <button
                onClick={onEdit}
                className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--color-border)] px-3 py-1.5 text-sm font-medium text-white/90 transition hover:bg-white/5"
              >
                <Pencil className="h-4 w-4" /> Edit
              </button>
            )}
            <button
              onClick={onDownload}
              className="inline-flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-blue-500 to-emerald-500 px-3 py-1.5 text-sm font-semibold text-white transition hover:brightness-110"
            >
              <Download className="h-4 w-4" /> Download
            </button>
          </div>
        )}
      </div>

      {/* Viewport. Normal: page-shaped (8.5×11). Edit mode (fill): fills the column height
          and the PDF scrolls inside its own box, independent of the chat. */}
      <div
        className={`relative w-full bg-black/20 ${
          fill ? 'min-h-0 flex-1' : 'aspect-[8.5/11]'
        }`}
      >
        {gen.status === 'idle' && (
          <Centered>
            <FileText className="mb-3 h-10 w-10 text-[var(--color-muted)]" />
            <p className="text-sm text-[var(--color-muted)]">
              Your tailored resume will appear here after generating.
            </p>
          </Centered>
        )}

        {gen.status === 'generating' && <GeneratingLoader />}

        {gen.status === 'success' && (
          // #toolbar=0&navpanes=0 hides the viewer chrome; view=FitH fits page width.
          // Scrollbar left ON so a 2-page result can be scrolled.
          <iframe
            title="resume preview"
            src={`${gen.pdfUrl}#toolbar=0&navpanes=0&view=FitH`}
            className="absolute inset-0 h-full w-full bg-white"
          />
        )}

        {gen.status === 'error' && (
          <Centered>
            <AlertTriangle className="mb-3 h-8 w-8 text-red-300" />
            <p className="text-sm text-red-300">{gen.error?.message}</p>
            {gen.error?.log && (
              <div className="mt-3 w-full max-w-md text-left">
                <button
                  onClick={() => setShowLog((s) => !s)}
                  className="flex items-center gap-1 text-xs text-[var(--color-muted)] hover:text-white"
                >
                  <ChevronDown
                    className={`h-3.5 w-3.5 transition ${showLog ? 'rotate-180' : ''}`}
                  />
                  {showLog ? 'Hide' : 'Show'} details
                </button>
                {showLog && (
                  <pre className="mt-2 max-h-40 overflow-auto rounded-lg bg-black/50 p-3 text-[11px] text-red-200/80">
                    {gen.error.log}
                  </pre>
                )}
              </div>
            )}
          </Centered>
        )}
      </div>

      {gen.status === 'success' && gen.warning && (
        <div className="flex items-center gap-2 border-t border-amber-500/20 bg-amber-500/5 px-4 py-2.5 text-xs text-amber-200">
          <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
          {gen.warning}
        </div>
      )}
    </div>
  )
}

function Centered({ children }) {
  return (
    <div className="absolute inset-0 grid place-items-center px-6 text-center">
      <div className="flex flex-col items-center">{children}</div>
    </div>
  )
}
