// Auth state for the whole app. Holds the current user, exposes login/signup/logout.
//
// Boot is OPTIMISTIC: a non-expired token + cached user render the app instantly, then
// GET /auth/me re-validates in the background. We only log out if the server actually
// rejects the token (401) — a slow/cold backend or network blip keeps the session.
// (The backend is on a free tier that can take many seconds to wake; blocking the whole
// app on that check made every reload feel broken.) FRONTEND.md §0: hooks own async.

import { createContext, useContext, useEffect, useState } from 'react'

import {
  cacheUser,
  clearToken,
  getCachedUser,
  getMe,
  getToken,
  isTokenExpired,
  login as apiLogin,
  setToken,
  signup as apiSignup,
  userFromToken,
} from '../services/api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true) // true only until we decide the initial user

  // On first load: trust a valid token optimistically, then verify in the background.
  useEffect(() => {
    const token = getToken()

    // No token, or it's already expired client-side -> definitely logged out.
    if (!token || isTokenExpired(token)) {
      clearToken()
      setLoading(false)
      return
    }

    // Optimistic: show the app immediately from the cached user (or the token's id).
    setUser(getCachedUser() ?? userFromToken(token))
    setLoading(false)

    // Background re-validation. Only a real 401 logs the user out; cold-start/network
    // failures (status 0) are ignored so the session survives a sleeping backend.
    getMe()
      .then((fresh) => {
        setUser(fresh)
        cacheUser(fresh)
      })
      .catch((err) => {
        if (err?.status === 401) {
          clearToken()
          setUser(null)
        }
      })
  }, [])

  async function login(email, password) {
    const { token, user } = await apiLogin(email, password)
    setToken(token)
    cacheUser(user)
    setUser(user)
    return user
  }

  async function signup(email, password) {
    const { token, user } = await apiSignup(email, password)
    setToken(token)
    cacheUser(user)
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
