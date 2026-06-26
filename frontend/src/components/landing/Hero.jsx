// Hero — Aceternity Spotlight + Magic UI shiny badge + the rotating Globe as the
// planetary centerpiece. Copy is intentionally short; the visual carries the weight.

import { motion } from 'motion/react'
import { ArrowRight, Sparkles } from 'lucide-react'
import { Link } from 'react-router-dom'

import { Spotlight } from '../ui/spotlight-new'
import { AnimatedShinyText } from '../ui/animated-shiny-text'
import { ShimmerButton } from '../ui/shimmer-button'
import { Globe } from '../ui/globe'

// Space-themed globe: dark blue planet, emerald city markers, blue glow.
const GLOBE_CONFIG = {
  width: 800,
  height: 800,
  onRender: () => {},
  devicePixelRatio: 2,
  phi: 0,
  theta: 0.3,
  dark: 1,
  diffuse: 1.2,
  mapSamples: 16000,
  mapBrightness: 6,
  baseColor: [0.12, 0.18, 0.32],
  markerColor: [0.06, 0.72, 0.5],
  glowColor: [0.15, 0.4, 0.85],
  markers: [
    { location: [14.5995, 120.9842], size: 0.03 },
    { location: [19.076, 72.8777], size: 0.1 },
    { location: [40.7128, -74.006], size: 0.1 },
    { location: [51.5074, -0.1278], size: 0.07 },
    { location: [37.7749, -122.4194], size: 0.08 },
    { location: [-23.5505, -46.6333], size: 0.1 },
    { location: [35.6762, 139.6503], size: 0.06 },
    { location: [1.3521, 103.8198], size: 0.05 },
  ],
}

export default function Hero() {
  return (
    <section className="relative flex min-h-screen items-center overflow-hidden px-4 pt-28 pb-16">
      <Spotlight />

      <div className="mx-auto grid w-full max-w-6xl items-center gap-8 lg:grid-cols-2">
        {/* Left: short copy */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
        >
          <div className="mb-6 inline-flex items-center rounded-full border border-[var(--color-border)] bg-white/5 px-1 py-1">
            <AnimatedShinyText className="inline-flex items-center gap-1.5 px-3 text-sm">
              <Sparkles className="h-3.5 w-3.5 text-emerald-400" />
              AI resumes, grounded in your real work
            </AnimatedShinyText>
          </div>

          <h1 className="text-4xl font-bold leading-[1.1] tracking-tight text-white sm:text-5xl lg:text-6xl">
            One profile.{' '}
            <span className="text-gradient">Every job.</span>
          </h1>

          <p className="mt-5 max-w-md text-lg text-[var(--color-muted)]">
            Paste a job. Get a one-page, ATS-clean resume tailored to it — in seconds.
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Link to="/signup">
              <ShimmerButton
                background="rgba(59,130,246,0.18)"
                className="px-6 py-3 text-base font-semibold"
              >
                Build my resume
                <ArrowRight className="ml-2 h-4 w-4" />
              </ShimmerButton>
            </Link>
            <a
              href="#how"
              className="rounded-full border border-[var(--color-border)] px-6 py-3 text-base font-medium text-white/90 transition hover:bg-white/5"
            >
              How it works
            </a>
          </div>
        </motion.div>

        {/* Right: the rotating planet, with a couple of floating signal chips */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.15, ease: 'easeOut' }}
          className="relative mx-auto aspect-square w-full max-w-md"
        >
          <Globe config={GLOBE_CONFIG} />

          <Chip className="left-2 top-10" tone="emerald">
            92% match
          </Chip>
          <Chip className="right-0 top-1/3" tone="blue">
            ATS-clean
          </Chip>
          <Chip className="bottom-12 left-6" tone="blue">
            1 page
          </Chip>
        </motion.div>
      </div>
    </section>
  )
}

function Chip({ children, className, tone }) {
  const tones = {
    emerald: 'text-emerald-300 ring-emerald-500/30',
    blue: 'text-blue-200 ring-blue-500/30',
  }
  return (
    <motion.span
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.8, duration: 0.5 }}
      className={`glass absolute rounded-full px-3 py-1.5 text-xs font-semibold ring-1 ${tones[tone]} ${className}`}
    >
      {children}
    </motion.span>
  )
}
