// Left pane: the LaTeX code editor (CodeMirror).
// Dumb component — value in, onChange out. No logic.

import CodeMirror from '@uiw/react-codemirror'
import { StreamLanguage } from '@codemirror/language'
import { stex } from '@codemirror/legacy-modes/mode/stex'

const latex = StreamLanguage.define(stex)

export default function EditorPanel({ value, onChange }) {
  return (
    <section className="glass rounded-2xl overflow-hidden flex flex-col min-h-0">
      <div className="flex items-center gap-2 px-4 py-2.5 border-b border-[var(--color-border)]">
        <span className="flex gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-rose-400/70" />
          <span className="w-2.5 h-2.5 rounded-full bg-amber-300/70" />
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400/70" />
        </span>
        <span className="ml-1 text-xs text-[var(--color-muted)] font-[var(--font-mono)]">
          resume.tex
        </span>
      </div>

      <div className="flex-1 min-h-0 overflow-auto">
        <CodeMirror
          value={value}
          onChange={onChange}
          theme="dark"
          extensions={[latex]}
          height="100%"
          style={{ height: '100%', fontSize: 13 }}
          basicSetup={{
            lineNumbers: true,
            highlightActiveLine: true,
            foldGutter: true,
            autocompletion: false,
          }}
        />
      </div>
    </section>
  )
}
