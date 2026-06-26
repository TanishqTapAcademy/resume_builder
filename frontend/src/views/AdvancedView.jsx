// The escape hatch (PRD §5.6): raw LaTeX editor + live /compile preview.
// This is the original single-screen flow, demoted behind the Advanced tab.

import { useState } from 'react'

import EditorPanel from '../components/EditorPanel'
import PreviewPanel from '../components/PreviewPanel'
import { useCompile } from '../hooks/useCompile'
import { SAMPLE_RESUME } from '../lib/sampleResume'

export default function AdvancedView() {
  const [code, setCode] = useState(SAMPLE_RESUME)
  const { status, pdfUrl, error, compileNow } = useCompile(code)

  function handleDownload() {
    if (!pdfUrl) return
    const a = document.createElement('a')
    a.href = pdfUrl
    a.download = 'resume.pdf'
    a.click()
  }

  return (
    <main className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-2 gap-4 p-4">
      <div className="flex flex-col min-h-0 gap-2">
        <div className="flex justify-end">
          <button
            onClick={compileNow}
            disabled={status === 'compiling'}
            className="px-3.5 py-1.5 text-xs font-medium rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-2)] hover:border-[var(--color-accent)] hover:text-white transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {status === 'compiling' ? 'Compiling…' : 'Compile'}
          </button>
        </div>
        <EditorPanel value={code} onChange={setCode} />
      </div>

      <PreviewPanel
        busy={status === 'compiling'}
        pdfUrl={pdfUrl}
        error={error}
        onDownload={handleDownload}
        emptyHint="Your compiled PDF will appear here."
      />
    </main>
  )
}
