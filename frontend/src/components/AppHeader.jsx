// Shared top bar for logged-in pages: brand + nav (Dashboard / Profile) + user + logout.

import { Link, useLocation, useNavigate } from 'react-router-dom'
import { LogOut } from 'lucide-react'

import { useAuth } from '../auth/AuthContext'
import Logo from './landing/Logo'

const NAV = [
  { to: '/dashboard', label: 'Dashboard' },
  { to: '/profile', label: 'Profile' },
]

export default function AppHeader() {
  const { user, logout } = useAuth()
  const { pathname } = useLocation()
  const navigate = useNavigate()

  function handleLogout() {
    logout()
    navigate('/', { replace: true })
  }

  return (
    <header className="glass mx-4 mt-4 flex items-center justify-between rounded-2xl px-4 py-2.5">
      <div className="flex items-center gap-6">
        <Link to="/dashboard">
          <Logo />
        </Link>
        <nav className="hidden items-center gap-1 sm:flex">
          {NAV.map((n) => (
            <Link
              key={n.to}
              to={n.to}
              className={`rounded-lg px-3 py-2 text-sm font-medium transition ${
                pathname === n.to
                  ? 'bg-white/10 text-white'
                  : 'text-[var(--color-muted)] hover:text-white'
              }`}
            >
              {n.label}
            </Link>
          ))}
        </nav>
      </div>

      <div className="flex items-center gap-3">
        <span className="hidden text-sm text-[var(--color-muted)] sm:block">
          {user?.email}
        </span>
        <button
          onClick={handleLogout}
          className="flex items-center gap-1.5 rounded-lg border border-[var(--color-border)] px-3 py-2 text-sm text-white/90 transition hover:bg-white/5"
        >
          <LogOut className="h-4 w-4" />
          <span className="hidden sm:inline">Log out</span>
        </button>
      </div>
    </header>
  )
}
