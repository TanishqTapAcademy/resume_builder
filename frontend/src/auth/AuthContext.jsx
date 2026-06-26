// Auth state for the whole app. Holds the current user, exposes login/signup/logout,
// and on boot validates any stored token via GET /auth/me (the "already logged in?"
// check that decides landing vs dashboard). FRONTEND.md §0: hooks own async, not panels.

import { createContext, useContext, useEffect, useState } from 'react'

import {
  clearToken,
  getMe,
  getToken,
  login as apiLogin,
  setToken,
  signup as apiSignup,
} from '../services/api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true) // true until the boot /me check resolves

  // On first load: if a token exists, confirm it's still valid.
  useEffect(() => {
    if (!getToken()) {
      setLoading(false)
      return
    }
    getMe()
      .then(setUser)
      .catch(() => clearToken()) // stale/expired token -> drop it
      .finally(() => setLoading(false))
  }, [])

  async function login(email, password) {
    const { token, user } = await apiLogin(email, password)
    setToken(token)
    setUser(user)
    return user
  }

  async function signup(email, password) {
    const { token, user } = await apiSignup(email, password)
    setToken(token)
    setUser(user)
    return user
  }

  function logout() {
    clearToken()
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, signup, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>')
  return ctx
}
