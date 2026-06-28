// Support page (logged-in). A clear, no-frills directory of every way to reach the
// maker for help — no photo, just contacts. Same shell as Dashboard/Profile.

import { motion } from 'framer-motion'
import {
  Mail,
  Phone,
  Globe,
  MapPin,
  ArrowUpRight,
  LifeBuoy,
  Copy,
  Check,
} from 'lucide-react'
import { useState } from 'react'

import SpaceBackground from '../components/space/SpaceBackground'
import AppHeader from '../components/AppHeader'

// Brand icons (lucide ships no GitHub/LinkedIn marks) — minimal inline SVGs.
function Github({ size = 18 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M12 .5C5.37.5 0 5.78 0 12.29c0 5.21 3.44 9.63 8.2 11.19.6.11.82-.25.82-.56v-2.2c-3.34.71-4.04-1.58-4.04-1.58-.55-1.36-1.34-1.72-1.34-1.72-1.09-.73.08-.72.08-.72 1.2.08 1.84 1.21 1.84 1.21 1.07 1.8 2.8 1.28 3.49.98.11-.76.42-1.28.76-1.58-2.67-.3-5.47-1.31-5.47-5.81 0-1.28.47-2.33 1.23-3.15-.12-.3-.53-1.51.12-3.15 0 0 1.01-.32 3.3 1.2a11.6 11.6 0 0 1 6 0c2.29-1.52 3.3-1.2 3.3-1.2.65 1.64.24 2.85.12 3.15.77.82 1.23 1.87 1.23 3.15 0 4.51-2.81 5.5-5.49 5.79.43.37.81 1.1.81 2.22v3.29c0 .31.21.68.83.56C20.57 21.91 24 17.5 24 12.29 24 5.78 18.63.5 12 .5Z" />
    </svg>
  )
}

function Linkedin({ size = 18 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M20.45 20.45h-3.56v-5.57c0-1.33-.02-3.04-1.85-3.04-1.85 0-2.13 1.45-2.13 2.94v5.67H9.35V9h3.42v1.56h.05c.48-.9 1.64-1.85 3.37-1.85 3.6 0 4.27 2.37 4.27 5.46v6.28ZM5.34 7.43a2.06 2.06 0 1 1 0-4.13 2.06 2.06 0 0 1 0 4.13ZM7.12 20.45H3.55V9h3.57v11.45ZM22.22 0H1.77C.79 0 0 .77 0 1.73v20.54C0 23.22.79 24 1.77 24h20.45c.98 0 1.78-.78 1.78-1.73V1.73C24 .77 23.2 0 22.22 0Z" />
    </svg>
  )
}

const MAKER = {
  name: 'Tanishq Bhosale',
  role: 'Maker of this app',
  location: 'Bangalore, India',
}

// Every channel, flat and clear. `copy` holds the plain value for the copy button.
const CHANNELS = [
  {
    key: 'email',
    icon: Mail,
    label: 'Email',
    value: 'bhosaletanishq4@gmail.com',
    copy: 'bhosaletanishq4@gmail.com',
    href: 'mailto:bhosaletanishq4@gmail.com?subject=Help%20with%20Resume%20Builder',
    note: 'Best for detailed issues — I usually reply within a day.',
  },
  {
    key: 'phone',
    icon: Phone,
    label: 'Phone',
    value: '+91 6362157894',
    copy: '+916362157894',
    href: 'tel:+916362157894',
    note: 'Call or text for anything urgent.',
  },
  {
    key: 'website',
    icon: Globe,
    label: 'Website',
    value: 'thetan.in',
    href: 'https://thetan.in',
    external: true,
    note: 'More about me and my work.',
  },
  {
    key: 'github-work',
    icon: Github,
    label: 'GitHub',
    value: 'github.com/TanishqWork',
    href: 'https://github.com/TanishqWork',
    external: true,
    note: 'Primary — report a bug or browse the code.',
  },
  {
    key: 'github',
    icon: Github,
    label: 'GitHub',
    value: 'github.com/TanishqBhosale',
    href: 'https://github.com/TanishqBhosale',
    external: true,
    note: 'Secondary profile.',
  },
  {
    key: 'linkedin',
    icon: Linkedin,
    label: 'LinkedIn',
    value: 'in/tanishq-bhosale',
    href: 'https://www.linkedin.com/in/tanishq-bhosale/',
    external: true,
    note: 'Connect professionally.',
  },
]

const fadeUp = {
  hidden: { opacity: 0, y: 18 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] } },
}

function ChannelRow({ ch }) {
  const Icon = ch.icon
  const [copied, setCopied] = useState(false)

  function handleCopy() {
    if (!ch.copy) return
    navigator.clipboard?.writeText(ch.copy).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    })
  }

  return (
    <motion.div
      variants={fadeUp}
      className="glass flex items-center gap-4 rounded-2xl p-4 transition hover:border-[var(--color-accent)]"
    >
      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white/[0.04] text-[var(--color-accent-soft)]">
        <Icon size={18} />
      </span>

      <div className="min-w-0 flex-1">
        <p className="text-xs font-medium text-[var(--color-muted)]">{ch.label}</p>
        <a
          href={ch.href}
          {...(ch.external ? { target: '_blank', rel: 'noreferrer' } : {})}
          className="block truncate font-semibold text-white transition hover:text-[var(--color-accent-soft)]"
        >
          {ch.value}
        </a>
        <p className="mt-0.5 truncate text-xs text-[var(--color-muted)]">{ch.note}</p>
      </div>

      <div className="flex shrink-0 items-center gap-1.5">
        {ch.copy && (
          <button
            onClick={handleCopy}
            aria-label={`Copy ${ch.label}`}
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-[var(--color-border)] text-[var(--color-muted)] transition hover:bg-white/5 hover:text-white"
          >
            {copied ? <Check size={15} className="text-emerald-400" /> : <Copy size={15} />}
          </button>
        )}
        <a
          href={ch.href}
          {...(ch.external ? { target: '_blank', rel: 'noreferrer' } : {})}
          aria-label={`Open ${ch.label}`}
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-[var(--color-border)] text-[var(--color-muted)] transition hover:bg-white/5 hover:text-white"
        >
          <ArrowUpRight size={15} />
        </a>
      </div>
    </motion.div>
  )
}

export default function Support() {
  return (
    <div className="relative min-h-screen pb-16">
      <SpaceBackground />
      <AppHeader />

      <main className="mx-auto max-w-3xl px-4 py-10">
        <motion.div initial="hidden" animate="show" variants={fadeUp} className="mb-8">
          <p className="flex items-center gap-2 text-sm font-medium text-[var(--color-accent-soft)]">
            <LifeBuoy size={16} /> Support
          </p>
          <h1 className="mt-2 text-2xl font-bold tracking-tight text-white sm:text-3xl">
            Get in touch
          </h1>
          <p className="mt-1 text-[var(--color-muted)]">
            Facing any issue with the app? Reach {MAKER.name} directly through any channel below.
          </p>
          <p className="mt-1 flex items-center gap-1.5 text-sm text-[var(--color-muted)]">
            <MapPin size={14} /> {MAKER.location}
          </p>
        </motion.div>

        <motion.div
          initial="hidden"
          animate="show"
          variants={{ show: { transition: { staggerChildren: 0.07 } } }}
          className="space-y-3"
        >
          {CHANNELS.map((ch) => (
            <ChannelRow key={ch.key} ch={ch} />
          ))}
        </motion.div>

        <motion.div
          initial="hidden"
          animate="show"
          variants={fadeUp}
          className="glass mt-6 rounded-2xl p-5 text-center text-sm text-[var(--color-muted)]"
        >
          Prefer email for bugs — include what you were doing and any error you saw, and I'll
          get back to you quickly.
        </motion.div>
      </main>
    </div>
  )
}
