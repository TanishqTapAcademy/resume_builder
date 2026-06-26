// Top bar: brand + the two view tabs (Tailor / Advanced). Dumb component.

import logo from '../assets/logo.png'

const TABS = [
  { id: 'tailor', label: 'Tailor' },
  { id: 'advanced', label: 'Advanced (raw LaTeX)' },
]

export default function TopBar({ view, onView }) {
  return (
    <header className="flex items-center justify-between px-5 py-3 border-b border-[var(--color-border)]">
      <div className="flex items-center gap-2.5">
        <img
          src={logo}
          alt="Resume Builder logo"
          className="w-8 h-8 rounded-lg object-contain shadow-[0_0_20px_-2px_var(--color-accent)]"
        />
        <div className="leading-tight">
          <h1 className="text-sm font-semibold tracking-tight">Resume Builder</h1>
          <p className="text-[11px] text-[var(--color-muted)]">AI · tailored to the job</p>
        </div>
      </div>

      <nav className="flex items-center gap-1 p-1 rounded-xl bg-[var(--color-surface-2)] border border-[var(--color-border)]">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => onView(t.id)}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition ${
              view === t.id
                ? 'bg-[var(--color-accent)] text-white'
                : 'text-[var(--color-muted)] hover:text-white'
            }`}
          >
            {t.label}
          </button>
        ))}
      </nav>
    </header>
  )
}
