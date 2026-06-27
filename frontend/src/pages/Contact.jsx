// Public "Contact / About me" page. A cinematic, space-themed profile card for
// Tanishq Bhosale — hero portrait, animated skill clusters, experience & projects,
// and a sticky CTA that redirects to the personal website (thetan.com).

import { Link } from 'react-router-dom'
import { motion, useReducedMotion } from 'framer-motion'
import {
  Mail,
  Phone,
  MapPin,
  Globe,
  ArrowUpRight,
  ArrowLeft,
  Sparkles,
} from 'lucide-react'

import SpaceBackground from '../components/space/SpaceBackground'

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

// ── The single source of truth for everything rendered on this page ──────────
const PROFILE = {
  name: 'Tanishq Bhosale',
  role: 'Backend & AI Engineer',
  location: 'Bangalore, India',
  website: 'https://thetan.com',
  websiteLabel: 'thetan.com',
  email: 'bhosaletanishq4@gmail.com',
  phone: '+91 6362157894',
  githubWork: 'https://github.com/TanishqWork',
  github: 'https://github.com/TanishqBhosale',
  linkedin: 'https://www.linkedin.com/in/tanishq-bhosale/',
  summary:
    'Backend Engineer with 2+ years building scalable backend systems, real-time APIs, and AI-powered applications using FastAPI, PostgreSQL, and AWS. I build production LLM and agentic AI systems — async architectures, microservices, streaming, and performance tuning for real workloads.',
}

const STATS = [
  { value: '2+', label: 'Years building' },
  { value: '12+', label: 'Projects shipped' },
  { value: '3', label: 'Companies' },
  { value: '40%', label: 'Latency cut' },
]

const SKILLS = [
  {
    category: 'AI / ML',
    items: [
      'LangGraph', 'LangChain', 'LLM Integration', 'RAG', 'pgvector',
      'Agentic Workflows', 'Prompt Engineering', 'Mem0', 'SSE Streaming',
      'Generative AI', 'NLP', 'AI Agents',
    ],
  },
  { category: 'Languages', items: ['Python', 'JavaScript', 'TypeScript'] },
  {
    category: 'Frontend',
    items: ['React', 'React Native', 'Expo', 'Redux', 'Zustand', 'Tailwind CSS', 'React Router'],
  },
  {
    category: 'Backend',
    items: ['FastAPI', 'Node.js', 'Flask', 'Prisma', 'Express.js', 'REST APIs', 'Microservices'],
  },
  { category: 'Databases', items: ['PostgreSQL', 'MongoDB', 'MySQL', 'pgvector'] },
  { category: 'Cloud', items: ['AWS', 'Firebase', 'Supabase', 'CI/CD', 'Git'] },
]

const EXPERIENCE = [
  {
    title: 'Full Stack Engineer',
    company: 'Tap Academy',
    period: 'Mar 2025 — Present',
    points: [
      'Built a production LLM code-assistance feature (OpenAI APIs, prompt engineering, SSE streaming) serving real-time suggestions to students.',
      'Architected a full-stack learning platform with React + FastAPI/Node.js and AI-driven feedback loops.',
      'Cut average API response time by 35% via PostgreSQL/MongoDB indexing and query restructuring.',
    ],
  },
  {
    title: 'Software Development Engineer 1',
    company: 'Quanta',
    period: 'Jul 2024 — Feb 2025',
    points: [
      'Built scalable async FastAPI and Flask microservices for real-time, low-latency collaboration.',
      'Designed production MySQL schemas and integrated third-party APIs for scalable workloads.',
      'Shipped modular, reusable backend services that accelerated feature delivery.',
    ],
  },
  {
    title: 'Software Developer Intern',
    company: 'Visionet Systems',
    period: 'Feb 2024 — Jul 2024',
    points: [
      'Built reusable AWS components and modular Python data-processing pipelines with optimized SQL queries.',
    ],
  },
]

const PROJECTS = [
  {
    name: 'AI Fitness Coach',
    date: '2025',
    tech: ['LangGraph', 'FastAPI', 'React Native', 'pgvector'],
    blurb:
      'Agentic AI fitness platform with 8 domain tools, Mem0 + pgvector context pipelines (−40% first-token latency) and real-time SSE streaming.',
  },
  {
    name: 'AI Resume Builder',
    date: '2024',
    tech: ['FastAPI', 'OpenAI', 'LaTeX', 'React', 'Neon'],
    blurb:
      'Full-stack résumé-tailoring app with a self-correcting LaTeX generate→compile→verify loop and an AI fact-judge guardrail against fabrication.',
  },
  {
    name: 'MindSnack Quiz Builder',
    date: '2025',
    tech: ['TypeScript', 'Express', 'Prisma', 'PostgreSQL'],
    blurb:
      'JSON-driven quiz/survey backend with no-code config, A/B testing, JWT auth, and analytics tracking 10+ conversion events per user.',
  },
  {
    name: 'AI Code Editor',
    date: '2024',
    tech: ['LLM', 'FastAPI', 'React', 'Node.js'],
    blurb:
      'Low-latency backend for AI code suggestions and contextual completions, with caching that cut token usage per request by 30%.',
  },
]

// ── Tiny animation helpers ───────────────────────────────────────────────────
const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] } },
}

const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.06, delayChildren: 0.1 } },
}

function Section({ children, className = '' }) {
  return (
    <motion.section
      variants={fadeUp}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, margin: '-80px' }}
      className={className}
    >
      {children}
    </motion.section>
  )
}

function SocialLink({ href, icon: Icon, label }) {
  return (
    <motion.a
      href={href}
      target="_blank"
      rel="noreferrer"
      whileHover={{ y: -3, scale: 1.04 }}
      whileTap={{ scale: 0.96 }}
      aria-label={label}
      className="glass flex h-11 w-11 items-center justify-center rounded-xl text-[var(--color-muted)] transition-colors hover:text-white"
    >
      <Icon size={18} />
    </motion.a>
  )
}

export default function Contact() {
  const reduce = useReducedMotion()

  return (
    <div className="relative min-h-screen overflow-hidden">
      <SpaceBackground />

      {/* Top bar — back home + quick website redirect */}
      <header className="fixed inset-x-0 top-0 z-50 px-4 pt-4">
        <nav className="glass mx-auto flex max-w-5xl items-center justify-between rounded-2xl px-4 py-2.5">
          <Link
            to="/"
            className="flex items-center gap-2 text-sm text-[var(--color-muted)] transition hover:text-white"
          >
            <ArrowLeft size={16} /> Home
          </Link>
          <a
            href={PROFILE.website}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1.5 rounded-lg bg-[rgba(59,130,246,0.15)] px-4 py-2 text-sm font-medium text-white ring-1 ring-[rgba(59,130,246,0.35)] transition hover:bg-[rgba(59,130,246,0.25)]"
          >
            Visit {PROFILE.websiteLabel} <ArrowUpRight size={15} />
          </a>
        </nav>
      </header>

      <main className="relative z-10 mx-auto max-w-5xl px-4 pb-28 pt-28 sm:pt-32">
        {/* ── HERO ─────────────────────────────────────────────────────────── */}
        <section className="grid items-center gap-10 md:grid-cols-[auto_1fr]">
          {/* Portrait */}
          <motion.div
            initial={{ opacity: 0, scale: 0.85 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
            className="relative mx-auto"
          >
            {/* glow ring */}
            <motion.div
              aria-hidden
              animate={reduce ? {} : { rotate: 360 }}
              transition={{ duration: 22, repeat: Infinity, ease: 'linear' }}
              className="absolute -inset-3 rounded-full bg-[conic-gradient(from_0deg,#3b82f6,#10b981,#60a5fa,#3b82f6)] opacity-60 blur-md"
            />
            <div className="relative h-44 w-44 overflow-hidden rounded-full ring-2 ring-white/10 sm:h-52 sm:w-52">
              <img
                src="/Tanishq.png"
                alt="Tanishq Bhosale"
                className="h-full w-full object-cover"
              />
            </div>
            <motion.span
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="glass absolute -bottom-2 left-1/2 flex -translate-x-1/2 items-center gap-1.5 whitespace-nowrap rounded-full px-3 py-1 text-xs font-medium text-emerald-300"
            >
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />
              Open to work
            </motion.span>
          </motion.div>

          {/* Intro */}
          <motion.div variants={stagger} initial="hidden" animate="show">
            <motion.p
              variants={fadeUp}
              className="flex items-center gap-2 text-sm font-medium text-[var(--color-accent-soft)]"
            >
              <Sparkles size={15} /> Hi, I'm
            </motion.p>
            <motion.h1
              variants={fadeUp}
              className="mt-2 text-4xl font-bold tracking-tight sm:text-6xl"
            >
              <span className="text-gradient">{PROFILE.name}</span>
            </motion.h1>
            <motion.p variants={fadeUp} className="mt-2 text-lg text-white/80">
              {PROFILE.role}
            </motion.p>
            <motion.p
              variants={fadeUp}
              className="mt-1 flex items-center gap-1.5 text-sm text-[var(--color-muted)]"
            >
              <MapPin size={14} /> {PROFILE.location}
            </motion.p>
            <motion.p
              variants={fadeUp}
              className="mt-5 max-w-xl text-[15px] leading-relaxed text-white/70"
            >
              {PROFILE.summary}
            </motion.p>

            {/* Socials + primary CTA */}
            <motion.div variants={fadeUp} className="mt-6 flex flex-wrap items-center gap-3">
              <a
                href={PROFILE.website}
                target="_blank"
                rel="noreferrer"
                className="group relative inline-flex items-center gap-2 overflow-hidden rounded-xl bg-gradient-to-r from-[#3b82f6] to-[#10b981] px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-500/20 transition hover:shadow-emerald-500/30"
              >
                <Globe size={16} />
                Explore my website
                <ArrowUpRight size={15} className="transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
              </a>
              <div className="flex gap-2">
                <SocialLink href={PROFILE.githubWork} icon={Github} label="GitHub (TanishqWork)" />
                <SocialLink href={PROFILE.github} icon={Github} label="GitHub (TanishqBhosale)" />
                <SocialLink href={PROFILE.linkedin} icon={Linkedin} label="LinkedIn" />
                <SocialLink href={`mailto:${PROFILE.email}`} icon={Mail} label="Email" />
              </div>
            </motion.div>
          </motion.div>
        </section>

        {/* ── STATS ─────────────────────────────────────────────────────────── */}
        <Section className="mt-16">
          <motion.div
            variants={stagger}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true }}
            className="grid grid-cols-2 gap-3 sm:grid-cols-4"
          >
            {STATS.map((s) => (
              <motion.div
                key={s.label}
                variants={fadeUp}
                whileHover={{ y: -4 }}
                className="glass rounded-2xl p-5 text-center"
              >
                <div className="text-gradient text-3xl font-bold">{s.value}</div>
                <div className="mt-1 text-xs text-[var(--color-muted)]">{s.label}</div>
              </motion.div>
            ))}
          </motion.div>
        </Section>

        {/* ── SKILLS ────────────────────────────────────────────────────────── */}
        <Section className="mt-20">
          <h2 className="text-2xl font-semibold text-white">
            Skills & <span className="text-gradient">Tools</span>
          </h2>
          <p className="mt-1 text-sm text-[var(--color-muted)]">The stack I build with.</p>

          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            {SKILLS.map((group) => (
              <motion.div
                key={group.category}
                variants={fadeUp}
                initial="hidden"
                whileInView="show"
                viewport={{ once: true, margin: '-40px' }}
                className="glass rounded-2xl p-5"
              >
                <h3 className="text-sm font-semibold text-[var(--color-accent-soft)]">
                  {group.category}
                </h3>
                <motion.div
                  variants={stagger}
                  initial="hidden"
                  whileInView="show"
                  viewport={{ once: true }}
                  className="mt-3 flex flex-wrap gap-2"
                >
                  {group.items.map((item) => (
                    <motion.span
                      key={item}
                      variants={fadeUp}
                      whileHover={{ scale: 1.06, y: -2 }}
                      className="cursor-default rounded-lg border border-[var(--color-border)] bg-white/[0.03] px-2.5 py-1 text-xs text-white/80 transition hover:border-[var(--color-accent)] hover:text-white"
                    >
                      {item}
                    </motion.span>
                  ))}
                </motion.div>
              </motion.div>
            ))}
          </div>
        </Section>

        {/* ── EXPERIENCE ────────────────────────────────────────────────────── */}
        <Section className="mt-20">
          <h2 className="text-2xl font-semibold text-white">
            Where I've <span className="text-gradient">Worked</span>
          </h2>
          <div className="mt-6 space-y-4 border-l border-[var(--color-border)] pl-6">
            {EXPERIENCE.map((job) => (
              <motion.div
                key={job.company}
                variants={fadeUp}
                initial="hidden"
                whileInView="show"
                viewport={{ once: true, margin: '-40px' }}
                className="relative"
              >
                <span className="absolute -left-[31px] top-1.5 h-3 w-3 rounded-full bg-[var(--color-accent)] ring-4 ring-black" />
                <div className="glass rounded-2xl p-5">
                  <div className="flex flex-wrap items-baseline justify-between gap-x-3">
                    <h3 className="font-semibold text-white">
                      {job.title} ·{' '}
                      <span className="text-[var(--color-accent-soft)]">{job.company}</span>
                    </h3>
                    <span className="text-xs text-[var(--color-muted)]">{job.period}</span>
                  </div>
                  <ul className="mt-3 space-y-1.5">
                    {job.points.map((p, i) => (
                      <li key={i} className="flex gap-2 text-sm text-white/70">
                        <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-[var(--color-accent-2)]" />
                        {p}
                      </li>
                    ))}
                  </ul>
                </div>
              </motion.div>
            ))}
          </div>
        </Section>

        {/* ── PROJECTS ──────────────────────────────────────────────────────── */}
        <Section className="mt-20">
          <h2 className="text-2xl font-semibold text-white">
            Selected <span className="text-gradient">Projects</span>
          </h2>
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            {PROJECTS.map((proj) => (
              <motion.div
                key={proj.name}
                variants={fadeUp}
                initial="hidden"
                whileInView="show"
                viewport={{ once: true, margin: '-40px' }}
                whileHover={{ y: -5 }}
                className="glass group flex flex-col rounded-2xl p-5"
              >
                <div className="flex items-baseline justify-between">
                  <h3 className="font-semibold text-white transition group-hover:text-[var(--color-accent-soft)]">
                    {proj.name}
                  </h3>
                  <span className="text-xs text-[var(--color-muted)]">{proj.date}</span>
                </div>
                <p className="mt-2 flex-1 text-sm leading-relaxed text-white/70">{proj.blurb}</p>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {proj.tech.map((t) => (
                    <span
                      key={t}
                      className="rounded-md bg-white/[0.04] px-2 py-0.5 text-[11px] text-[var(--color-accent-2-soft)]"
                    >
                      {t}
                    </span>
                  ))}
                </div>
              </motion.div>
            ))}
          </div>
        </Section>

        {/* ── CONTACT CTA ───────────────────────────────────────────────────── */}
        <Section className="mt-20">
          <div className="glass relative overflow-hidden rounded-3xl p-8 text-center sm:p-12">
            <div
              aria-hidden
              className="absolute inset-0 -z-10 bg-[radial-gradient(60%_80%_at_50%_0%,rgba(59,130,246,0.18),transparent_70%),radial-gradient(50%_70%_at_50%_120%,rgba(16,185,129,0.16),transparent_70%)]"
            />
            <h2 className="text-3xl font-bold sm:text-4xl">
              Let's <span className="text-gradient">build something</span>
            </h2>
            <p className="mx-auto mt-3 max-w-lg text-white/70">
              Have a project, role, or idea in mind? I'm always up for a good conversation.
            </p>

            <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
              <motion.a
                href={`mailto:${PROFILE.email}`}
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.97 }}
                className="inline-flex items-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-semibold text-black transition hover:bg-white/90"
              >
                <Mail size={16} /> {PROFILE.email}
              </motion.a>
              <motion.a
                href={`tel:${PROFILE.phone.replace(/\s/g, '')}`}
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.97 }}
                className="glass inline-flex items-center gap-2 rounded-xl px-5 py-3 text-sm font-semibold text-white"
              >
                <Phone size={16} /> {PROFILE.phone}
              </motion.a>
            </div>

            {/* Website redirect — the highlighted action */}
            <motion.a
              href={PROFILE.website}
              target="_blank"
              rel="noreferrer"
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.98 }}
              className="group mx-auto mt-5 inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#3b82f6] to-[#10b981] px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-emerald-500/20"
            >
              <Globe size={16} />
              Go to {PROFILE.websiteLabel}
              <ArrowUpRight
                size={16}
                className="transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
              />
            </motion.a>
          </div>
        </Section>
      </main>

      {/* ── FOOTER with website link ───────────────────────────────────────── */}
      <footer className="relative z-10 border-t border-[var(--color-border)] px-4 py-10">
        <div className="mx-auto flex max-w-5xl flex-col items-center justify-between gap-4 text-center sm:flex-row sm:text-left">
          <div>
            <p className="font-semibold text-white">{PROFILE.name}</p>
            <p className="text-sm text-[var(--color-muted)]">{PROFILE.role}</p>
          </div>

          <a
            href={PROFILE.website}
            target="_blank"
            rel="noreferrer"
            className="group inline-flex items-center gap-2 text-sm font-medium text-[var(--color-accent-soft)] transition hover:text-white"
          >
            <Globe size={15} />
            {PROFILE.websiteLabel}
            <ArrowUpRight size={14} className="transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          </a>

          <div className="flex gap-2">
            <SocialLink href={PROFILE.githubWork} icon={Github} label="GitHub (TanishqWork)" />
            <SocialLink href={PROFILE.github} icon={Github} label="GitHub (TanishqBhosale)" />
            <SocialLink href={PROFILE.linkedin} icon={Linkedin} label="LinkedIn" />
            <SocialLink href={`mailto:${PROFILE.email}`} icon={Mail} label="Email" />
          </div>
        </div>
        <p className="mt-6 text-center text-xs text-[var(--color-muted)]">
          © {new Date().getFullYear()} {PROFILE.name}. Built with React, Tailwind & Framer Motion.
        </p>
      </footer>
    </div>
  )
}
