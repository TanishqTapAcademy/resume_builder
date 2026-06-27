// Compact "need help?" support card shown on the logged-in dashboard & profile.
// Shows the maker's photo and direct contact actions so users facing any issue can
// reach out instantly — with a link to the full contact page.

import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Mail, Phone, ArrowUpRight, LifeBuoy } from 'lucide-react'

const MAKER = {
  name: 'Tanishq Bhosale',
  role: 'Maker of this app',
  email: 'bhosaletanishq4@gmail.com',
  phone: '+91 6362157894',
}

export default function SupportCard({ className = '' }) {
  return (
    <motion.aside
      initial={{ opacity: 0, y: 18 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className={`glass relative overflow-hidden rounded-2xl p-5 ${className}`}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(70%_90%_at_0%_0%,rgba(59,130,246,0.14),transparent_70%),radial-gradient(60%_90%_at_100%_100%,rgba(16,185,129,0.12),transparent_70%)]"
      />

      <div className="flex items-center gap-4">
        {/* Photo with glow ring */}
        <div className="relative shrink-0">
          <div
            aria-hidden
            className="absolute -inset-1 rounded-full bg-[conic-gradient(from_0deg,#3b82f6,#10b981,#60a5fa,#3b82f6)] opacity-60 blur-[3px]"
          />
          <img
            src="/Tanishq.png"
            alt={MAKER.name}
            className="relative h-14 w-14 rounded-full object-cover ring-2 ring-white/10"
          />
        </div>

        <div className="min-w-0">
          <p className="flex items-center gap-1.5 text-xs font-medium text-[var(--color-accent-soft)]">
            <LifeBuoy size={13} /> Need help?
          </p>
          <p className="truncate font-semibold text-white">{MAKER.name}</p>
          <p className="truncate text-xs text-[var(--color-muted)]">{MAKER.role}</p>
        </div>
      </div>

      <p className="mt-3 text-sm leading-relaxed text-white/70">
        Running into any issue? Reach out directly — I'm happy to help.
      </p>

      <div className="mt-4 flex flex-wrap gap-2">
        <motion.a
          href={`mailto:${MAKER.email}?subject=Help%20with%20Resume%20Builder`}
          whileHover={{ y: -2 }}
          whileTap={{ scale: 0.97 }}
          className="inline-flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-blue-500 to-emerald-500 px-3 py-2 text-xs font-semibold text-white transition hover:brightness-110"
        >
          <Mail size={14} /> Email me
        </motion.a>
        <motion.a
          href={`tel:${MAKER.phone.replace(/\s/g, '')}`}
          whileHover={{ y: -2 }}
          whileTap={{ scale: 0.97 }}
          className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--color-border)] px-3 py-2 text-xs font-medium text-white/90 transition hover:bg-white/5"
        >
          <Phone size={14} /> Call
        </motion.a>
        <Link
          to="/contact"
          className="group inline-flex items-center gap-1.5 rounded-lg border border-[var(--color-border)] px-3 py-2 text-xs font-medium text-white/90 transition hover:bg-white/5"
        >
          More
          <ArrowUpRight
            size={13}
            className="transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
          />
        </Link>
      </div>
    </motion.aside>
  )
}
