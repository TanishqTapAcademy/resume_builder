// The one screen (FRONTEND.md): header + editor | preview.
// App owns the `code` state; the hook owns compile state; components stay dumb.

import { useState } from 'react'

import Header from './components/Header'
import EditorPanel from './components/EditorPanel'
import PreviewPanel from './components/PreviewPanel'
import { useCompile } from './hooks/useCompile'
import { SAMPLE_RESUME } from './lib/sampleResume'

export default function App() {
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
    <div className="h-full flex flex-col">
      <Header
        status={status}
        canDownload={Boolean(pdfUrl)}
        onCompile={compileNow}
        onDownload={handleDownload}
      />

      <main className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-2 gap-4 p-4">
        <EditorPanel value={code} onChange={setCode} />
        <PreviewPanel status={status} pdfUrl={pdfUrl} error={error} />
      </main>
    </div>
  )
}
