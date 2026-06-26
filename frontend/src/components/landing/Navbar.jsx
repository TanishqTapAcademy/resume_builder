// Sticky glass navbar. Anchor links scroll the single landing page; the right side
// routes to auth. Dumb component — navigation handled by react-router Links.

import { Link } from 'react-router-dom'

import { ShimmerButton } from '../ui/shimmer-button'
import Logo from './Logo'

const LINKS = [
  { href: '#features', label: 'Features' },
  { href: '#how', label: 'How it works' },
  { href: '#demo', label: 'Try it' },
]

export default function Navbar() {
  return (
    <header className="fixed inset-x-0 top-0 z-50 px-4 pt-4">
      <nav className="glass mx-auto flex max-w-6xl items-center justify-between rounded-2xl px-4 py-2.5">
        <Link to="/">
          <Logo />
        </Link>

        <div className="hidden items-center gap-1 md:flex">
          {LINKS.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className="rounded-lg px-3 py-2 text-sm text-[var(--color-muted)] transition hover:text-white"
            >
              {l.label}
            </a>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <Link
            to="/login"
            className="rounded-lg px-3 py-2 text-sm font-medium text-[var(--color-muted)] transition hover:text-white"
          >
            Log in
          </Link>
          <Link to="/signup">
            <ShimmerButton
              background="rgba(59,130,246,0.15)"
              className="px-4 py-2 text-sm font-medium"
            >
              Get started
            </ShimmerButton>
          </Link>
        </div>
      </nav>
    </header>
  )
}
