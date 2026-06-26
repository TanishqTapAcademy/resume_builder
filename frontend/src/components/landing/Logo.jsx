// Brand wordmark — a glowing gradient mark + name. Reused in navbar, auth, footer.

import { Rocket } from 'lucide-react'

export default function Logo({ size = 'md' }) {
  const dim = size === 'lg' ? 'h-11 w-11' : 'h-9 w-9'
  const text = size === 'lg' ? 'text-xl' : 'text-base'
  return (
    <div className="flex items-center gap-2.5">
      <div
        className={`grid ${dim} place-items-center rounded-xl bg-gradient-to-br from-blue-500 to-emerald-500 shadow-[0_0_24px_-4px_rgba(59,130,246,0.7)]`}
      >
        <Rocket className="h-5 w-5 text-white" />
      </div>
      <span className={`${text} font-semibold tracking-tight text-white`}>
        Resume<span className="text-gradient">OS</span>
      </span>
    </div>
  )
}
