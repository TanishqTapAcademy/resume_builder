// The main product flow: paste JD -> check fit -> generate tailored PDF.
// Owns the form state; hooks own the async work; panels stay dumb.

import { useState } from 'react'

import MatchPanel from '../components/MatchPanel'
import PreviewPanel from '../components/PreviewPanel'
import { useGenerate } from '../hooks/useGenerate'
import { useMatch } from '../hooks/useMatch'
import { SAMPLE_RESUME } from '../lib/sampleResume'

export default function TailorView() {
  const [jd, setJd] = useState('')
  const [company, setCompany] = useState('')
  const [template, setTemplate] = useState(SAMPLE_RESUME)

  const match = useMatch()
  const gen = useGenerate()

  function handleDownload() {
    if (!gen.pdfUrl) return
    const a = document.createElement('a')
    a.href = gen.pdfUrl
    a.download = 'resume.pdf'
    a.click()
  }

  return (
    <main className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-2 gap-4 p-4">
      <MatchPanel
        jd={jd}
        setJd={setJd}
        company={company}
        setCompany={setCompany}
        match={match}
        onCheck={() => match.checkFit(jd, company)}
        template={template}
        setTemplate={setTemplate}
        genStatus={gen.status}
        onGenerate={() => gen.generate(jd, company, template)}
      />
      <PreviewPanel
        busy={gen.status === 'generating'}
        pdfUrl={gen.pdfUrl}
        error={gen.error}
        warning={gen.warning}
        onDownload={handleDownload}
        label="resume.pdf"
        emptyHint="Your tailored resume will appear here after generating."
      />
    </main>
  )
}
