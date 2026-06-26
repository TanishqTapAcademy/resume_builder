// Full-screen loading state shown while the boot /me check resolves.

import { Rocket } from 'lucide-react'

export default function Splash() {
  return (
    <div className="grid min-h-screen place-items-center bg-black">
      <div className="flex flex-col items-center gap-4">
        <div className="relative">
          <div className="absolute inset-0 animate-ping rounded-full bg-blue-500/30 blur-xl" />
          <div className="relative grid h-14 w-14 place-items-center rounded-2xl bg-gradient-to-br from-blue-500 to-emerald-500 shadow-[0_0_40px_-5px_rgba(59,130,246,0.6)]">
            <Rocket className="h-7 w-7 text-white" />
          </div>
        </div>
        <p className="text-sm text-[var(--color-muted)]">Preparing your workspace…</p>
      </div>
    </div>
  )
}
