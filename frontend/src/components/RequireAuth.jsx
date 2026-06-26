// Route guard for protected pages (dashboard, profile). While the boot /me check
// is running we show a splash; once resolved, no user -> bounce to /login.

import { Navigate, Outlet } from 'react-router-dom'

import { useAuth } from '../auth/AuthContext'
import Splash from './Splash'

export default function RequireAuth() {
  const { user, loading } = useAuth()

  if (loading) return <Splash />
  if (!user) return <Navigate to="/login" replace />
  return <Outlet />
}
