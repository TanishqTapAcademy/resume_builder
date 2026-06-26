// The #demo section — the interactive, no-login demo (one free per IP), promoted to
// sit right under the hero. Heavy on glow + spring "pop" so it grabs attention.

import { motion } from 'motion/react'
import { Sparkles } from 'lucide-react'

import DemoWidget from './DemoWidget'

export default function DemoTeaser() {
  return (
    <section id="demo" className="relative overflow-hidden px-4 py-20">
      {/* ambient section glows */}
      <div className="pointer-events-none absolute left-1/4 top-0 h-72 w-72 -translate-x-1/2 rounded-full bg-blue-500/20 blur-[100px]" />
      <div className="pointer-events-none absolute bottom-0 right-1/4 h-72 w-72 translate-x-1/2 rounded-full bg-emerald-500/20 blur-[100px]" />

      <div className="relative mx-auto max-w-4xl">
        {/* heading pops in */}
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.96 }}
          whileInView={{ opacity: 1, y: 0, scale: 1 }}
          viewport={{ once: true, margin: '-60px' }}
          transition={{ type: 'spring', stiffness: 140, damping: 14 }}
          className="mb-10 text-center"
        >
          <span className="mb-4 inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-300">
            <Sparkles className="h-3.5 w-3.5" /> Free · no signup
          </span>
          <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
            Try it now — <span className="text-gradient">see the magic</span>
          </h2>
          <p className="mx-auto mt-3 max-w-md text-[var(--color-muted)]">
            One free resume. Bring yours, paste a job, watch it get tailored.
          </p>
        </motion.div>

        {/* widget with a pulsing gradient halo + deep shadow */}
        <motion.div
          initial={{ opacity: 0, y: 40, scale: 0.9 }}
          whileInView={{ opacity: 1, y: 0, scale: 1 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ type: 'spring', stiffness: 110, damping: 16, delay: 0.05 }}
          className="relative"
        >
          {/* breathing halo behind the card */}
          <motion.div
            aria-hidden
            animate={{ opacity: [0.5, 0.85, 0.5], scale: [0.99, 1.02, 0.99] }}
            transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
            className="absolute -inset-3 rounded-[2rem] bg-gradient-to-r from-blue-500/40 via-emerald-500/30 to-blue-500/40 blur-2xl"
          />
          <div className="relative drop-shadow-[0_30px_80px_rgba(16,185,129,0.25)]">
            <DemoWidget />
          </div>
        </motion.div>
      </div>
    </section>
  )
}
