// Public landing page. Logged-in users are sent straight to the dashboard (the flow:
// token valid -> dashboard; otherwise -> landing).

import { Navigate } from 'react-router-dom'

import { useAuth } from '../auth/AuthContext'
import Splash from '../components/Splash'
import SpaceBackground from '../components/space/SpaceBackground'
import Navbar from '../components/landing/Navbar'
import Hero from '../components/landing/Hero'
import Features from '../components/landing/Features'
import HowItWorks from '../components/landing/HowItWorks'
import DemoTeaser from '../components/landing/DemoTeaser'
import Footer from '../components/landing/Footer'

export default function Landing() {
  const { user, loading } = useAuth()

  if (loading) return <Splash />
  if (user) return <Navigate to="/dashboard" replace />

  return (
    <div className="relative min-h-screen">
      <SpaceBackground />
      <Navbar />
      <main>
        <Hero />
        <DemoTeaser />
        <Features />
        <HowItWorks />
      </main>
      <Footer />
    </div>
  )
}
