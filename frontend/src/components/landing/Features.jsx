// Features grid. Glass cards with a blue/green icon and hover glow. motion stagger.

import { motion } from 'motion/react'
import { Target, ShieldCheck, FileCheck2, Upload, MessageSquare, Gauge } from 'lucide-react'

const FEATURES = [
  { icon: Target, title: 'JD-aware tailoring', body: 'Reframed for the exact role.' },
  { icon: ShieldCheck, title: 'Zero fabrication', body: 'Grounded in your real work.' },
  { icon: FileCheck2, title: 'One page, ATS-clean', body: 'Auto-fit. Parser-safe.' },
  { icon: Upload, title: 'PDF in, profile out', body: 'Upload or paste — we structure it.' },
  { icon: MessageSquare, title: 'Chat-edit', body: '“Add Docker.” Done.' },
  { icon: Gauge, title: 'Fit score first', body: 'Know the gaps before you apply.' },
]

export default function Features() {
  return (
    <section id="features" className="relative px-4 py-24">
      <div className="mx-auto max-w-6xl">
        <div className="mx-auto mb-14 max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
            Built to help you <span className="text-gradient">stand out</span>
          </h2>
        </div>

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-60px' }}
              transition={{ duration: 0.5, delay: i * 0.06 }}
              className="glass group relative overflow-hidden rounded-2xl p-6 transition hover:border-blue-500/40"
            >
              <div className="absolute -right-12 -top-12 h-32 w-32 rounded-full bg-blue-500/10 blur-2xl transition group-hover:bg-emerald-500/15" />
              <div className="relative mb-4 grid h-11 w-11 place-items-center rounded-xl bg-gradient-to-br from-blue-500/20 to-emerald-500/20 ring-1 ring-white/10">
                <f.icon className="h-5 w-5 text-blue-300" />
              </div>
              <h3 className="relative mb-2 text-lg font-semibold text-white">{f.title}</h3>
              <p className="relative text-sm leading-relaxed text-[var(--color-muted)]">
                {f.body}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
