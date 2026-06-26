// Flexible profile renderer. The profile JSON is freeform — its shape can change as the
// AI edits it — so this maps WHATEVER comes out into a clean view: known sections
// (contact, summary, experience, skills, projects, education) get tailored layouts;
// anything else is rendered generically so nothing is ever hidden or breaks.

// Note: lucide-react v1 removed brand icons (Linkedin/Github) — use a generic link icon.
import { Mail, Phone, MapPin, Link2, Globe } from 'lucide-react'

// camelCase / snake_case -> "Title Case"
function humanize(key) {
  return key
    .replace(/[_-]/g, ' ')
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/\b\w/g, (c) => c.toUpperCase())
    .trim()
}

function isEmpty(v) {
  if (v == null) return true
  if (typeof v === 'string') return v.trim() === ''
  if (Array.isArray(v)) return v.length === 0
  if (typeof v === 'object') return Object.values(v).every(isEmpty)
  return false
}

const isPrimitive = (v) => v == null || typeof v !== 'object'

// ── Generic value renderer ────────────────────────────────────────────────
function Value({ value }) {
  if (isEmpty(value)) return null

  if (isPrimitive(value)) {
    if (typeof value === 'boolean') return <span>{value ? 'Yes' : 'No'}</span>
    return <span className="text-white/90">{String(value)}</span>
  }

  if (Array.isArray(value)) {
    const allPrimitive = value.every(isPrimitive)
    if (allPrimitive) {
      return (
        <div className="flex flex-wrap gap-2">
          {value.map((v, i) => (
            <span
              key={i}
              className="rounded-md bg-blue-500/10 px-2.5 py-1 text-sm text-blue-200 ring-1 ring-inset ring-blue-500/20"
            >
              {String(v)}
            </span>
          ))}
        </div>
      )
    }
    return (
      <div className="space-y-3">
        {value.map((v, i) => (
          <ObjectCard key={i} obj={v} />
        ))}
      </div>
    )
  }

  // plain object
  return <KeyVals obj={value} />
}

// A card for one object inside an array (a job, project, degree, …).
function ObjectCard({ obj }) {
  if (isPrimitive(obj)) return <Value value={obj} />
  if (isEmpty(obj)) return null

  const entries = Object.entries(obj).filter(([, v]) => !isEmpty(v))
  // Heuristic: first short string field is the title; date-ish fields go to the corner.
  const titleKey = entries.find(
    ([k, v]) => typeof v === 'string' && /name|title|company|institution|degree/i.test(k),
  )?.[0]
  const dateParts = ['start', 'end', 'date', 'year']
    .map((k) => obj[k])
    .filter((v) => typeof v === 'string' && v.trim())

  return (
    <div className="rounded-xl border border-[var(--color-border)] bg-black/30 p-4">
      {(titleKey || dateParts.length > 0) && (
        <div className="mb-2 flex items-start justify-between gap-3">
          {titleKey && (
            <h4 className="font-semibold text-white">{String(obj[titleKey])}</h4>
          )}
          {dateParts.length > 0 && (
            <span className="shrink-0 text-xs text-[var(--color-muted)]">
              {dateParts.join(' – ')}
            </span>
          )}
        </div>
      )}
      <div className="space-y-2">
        {entries
          .filter(([k]) => k !== titleKey && !dateParts.includes(obj[k]))
          .map(([k, v]) => (
            <Row key={k} label={humanize(k)} value={v} inline={isPrimitive(v) || (Array.isArray(v) && v.every(isPrimitive))} />
          ))}
      </div>
    </div>
  )
}

// Object rendered as labelled rows.
function KeyVals({ obj }) {
  const entries = Object.entries(obj).filter(([, v]) => !isEmpty(v))
  return (
    <div className="space-y-2">
      {entries.map(([k, v]) => (
        <Row key={k} label={humanize(k)} value={v} inline={isPrimitive(v)} />
      ))}
    </div>
  )
}

function Row({ label, value, inline }) {
  return (
    <div className={inline ? 'flex gap-2 text-sm' : 'text-sm'}>
      <span className="shrink-0 text-[var(--color-muted)]">{label}:</span>
      <div className={inline ? '' : 'mt-1.5'}>
        <Value value={value} />
      </div>
    </div>
  )
}

// ── Contact header (special-cased for a clean top block) ──────────────────
const CONTACT_ICONS = {
  email: Mail,
  phone: Phone,
  location: MapPin,
  linkedin: Link2,
  github: Link2,
  website: Globe,
}

function ContactHeader({ contact }) {
  const name = contact.name || contact.fullName || ''
  const items = Object.entries(contact).filter(
    ([k, v]) => k !== 'name' && k !== 'fullName' && !isEmpty(v),
  )
  return (
    <div className="border-b border-[var(--color-border)] pb-6">
      {name && <h2 className="text-2xl font-bold text-white">{name}</h2>}
      <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-sm text-[var(--color-muted)]">
        {items.map(([k, v]) => {
          const Icon = CONTACT_ICONS[k.toLowerCase()]
          return (
            <span key={k} className="flex items-center gap-1.5">
              {Icon && <Icon className="h-3.5 w-3.5 text-blue-300" />}
              {String(v)}
            </span>
          )
        })}
      </div>
    </div>
  )
}

// ── Section wrapper ────────────────────────────────────────────────────────
function Section({ title, children }) {
  return (
    <section>
      <h3 className="mb-3 text-xs font-semibold uppercase tracking-widest text-emerald-300/80">
        {title}
      </h3>
      {children}
    </section>
  )
}

// Preferred display order; unknown keys are appended in their natural order.
const ORDER = ['summary', 'experience', 'projects', 'skills', 'education', 'other']

export default function ProfileView({ data }) {
  if (!data || typeof data !== 'object') {
    return <p className="text-[var(--color-muted)]">No profile data.</p>
  }

  const keys = Object.keys(data)
  const ordered = [
    ...ORDER.filter((k) => keys.includes(k)),
    ...keys.filter((k) => k !== 'contact' && !ORDER.includes(k)),
  ]

  return (
    <div className="space-y-8">
      {data.contact && !isEmpty(data.contact) && <ContactHeader contact={data.contact} />}
      {ordered.map((key) =>
        isEmpty(data[key]) ? null : (
          <Section key={key} title={humanize(key)}>
            <Value value={data[key]} />
          </Section>
        ),
      )}
    </div>
  )
}
