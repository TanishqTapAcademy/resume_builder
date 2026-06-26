// Login / signup. One component, two modes (driven by the route). Submits through
// AuthContext (which stores the JWT + sets the user), then routes to the dashboard.
// If already logged in, skip straight to the dashboard.

import { useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { motion } from 'motion/react'
import { Mail, Lock, Loader2, ArrowRight } from 'lucide-react'

import { useAuth } from '../auth/AuthContext'
import Splash from '../components/Splash'
import SpaceBackground from '../components/space/SpaceBackground'
import Logo from '../components/landing/Logo'

export default function Auth({ mode }) {
  const isSignup = mode === 'signup'
  const { user, loading, login, signup } = useAuth()
  const navigate = useNavigate()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  if (loading) return <Splash />
  if (user) return <Navigate to="/dashboard" replace />

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setSubmitting(true)
    try {
      if (isSignup) await signup(email, password)
      else await login(email, password)
      navigate('/dashboard', { replace: true })
    } catch (err) {
      setError(err.message || 'Something went wrong.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="relative grid min-h-screen place-items-center px-4">
      <SpaceBackground />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="glass w-full max-w-md rounded-3xl p-8"
      >
        <div className="mb-8 flex flex-col items-center gap-4 text-center">
          <Link to="/">
            <Logo size="lg" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-white">
              {isSignup ? 'Create your account' : 'Welcome back'}
            </h1>
            <p className="mt-1 text-sm text-[var(--color-muted)]">
              {isSignup
                ? 'Start tailoring resumes in minutes.'
                : 'Log in to your workspace.'}
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Field
            icon={Mail}
            type="email"
            placeholder="you@email.com"
            value={email}
            onChange={setEmail}
            autoComplete="email"
          />
          <Field
            icon={Lock}
            type="password"
            placeholder={isSignup ? 'Choose a password (min 8 chars)' : 'Your password'}
            value={password}
            onChange={setPassword}
            autoComplete={isSignup ? 'new-password' : 'current-password'}
          />

          {error && (
            <p className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-300">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="group flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-500 to-emerald-500 px-4 py-3 font-semibold text-white shadow-[0_0_30px_-8px_rgba(59,130,246,0.7)] transition hover:brightness-110 disabled:opacity-60"
          >
            {submitting ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <>
                {isSignup ? 'Create account' : 'Log in'}
                <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
              </>
            )}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-[var(--color-muted)]">
          {isSignup ? 'Already have an account?' : 'New here?'}{' '}
          <Link
            to={isSignup ? '/login' : '/signup'}
            className="font-medium text-blue-300 hover:text-blue-200"
          >
            {isSignup ? 'Log in' : 'Create an account'}
          </Link>
        </p>
      </motion.div>
    </div>
  )
}

function Field({ icon: Icon, type, placeholder, value, onChange, autoComplete }) {
  return (
    <div className="relative">
      <Icon className="pointer-events-none absolute left-3.5 top-1/2 h-4.5 w-4.5 -translate-y-1/2 text-[var(--color-muted)]" />
      <input
        type={type}
        required
        autoComplete={autoComplete}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-xl border border-[var(--color-border)] bg-black/40 py-3 pl-11 pr-4 text-white placeholder:text-[var(--color-muted)] outline-none transition focus:border-blue-500/60 focus:ring-1 focus:ring-blue-500/40"
      />
    </div>
  )
}
