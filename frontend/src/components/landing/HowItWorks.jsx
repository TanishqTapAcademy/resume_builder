// Three-step explainer with numbered nodes and a connecting gradient line.

import { motion } from 'motion/react'
import { UserPlus, ClipboardPaste, FileDown } from 'lucide-react'

const STEPS = [
  { icon: UserPlus, title: 'Add your profile', body: 'Upload a PDF or paste LaTeX.' },
  { icon: ClipboardPaste, title: 'Paste the job', body: 'See your fit score and gaps.' },
  { icon: FileDown, title: 'Get your resume', body: 'A tailored one-page PDF.' },
]

export default function HowItWorks() {
  return (
    <section id="how" className="relative px-4 py-24">
      <div className="mx-auto max-w-5xl">
        <div className="mx-auto mb-16 max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
            From profile to offer-ready in{' '}
            <span className="text-gradient">three steps</span>
          </h2>
        </div>

        <div className="relative grid gap-10 md:grid-cols-3">
          {/* connecting line (desktop) */}
          <div className="absolute left-0 right-0 top-7 hidden h-px bg-gradient-to-r from-transparent via-blue-500/40 to-transparent md:block" />

          {STEPS.map((s, i) => (
            <motion.div
              key={s.title}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-60px' }}
              transition={{ duration: 0.5, delay: i * 0.12 }}
              className="relative text-center"
            >
              <div className="relative z-10 mx-auto mb-5 grid h-14 w-14 place-items-center rounded-2xl border border-[var(--color-border)] bg-black shadow-[0_0_30px_-8px_rgba(16,185,129,0.5)]">
                <s.icon className="h-6 w-6 text-emerald-300" />
                <span className="absolute -right-2 -top-2 grid h-6 w-6 place-items-center rounded-full bg-gradient-to-br from-blue-500 to-emerald-500 text-xs font-bold text-white">
                  {i + 1}
                </span>
              </div>
              <h3 className="mb-2 text-lg font-semibold text-white">{s.title}</h3>
              <p className="mx-auto max-w-xs text-sm leading-relaxed text-[var(--color-muted)]">
                {s.body}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
