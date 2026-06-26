// Minimal footer.

import Logo from './Logo'

export default function Footer() {
  return (
    <footer className="relative border-t border-[var(--color-border)] px-4 py-10">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 sm:flex-row">
        <Logo />
        <p className="text-sm text-[var(--color-muted)]">
          Honest resumes, tailored by AI. Built for job seekers.
        </p>
        <p className="text-xs text-[var(--color-muted)]">
          © {new Date().getFullYear()} ResumeOS
        </p>
      </div>
    </footer>
  )
}
