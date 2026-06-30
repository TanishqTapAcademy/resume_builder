// Purely cosmetic "thinking" loader shown while a resume generates.
//
// The backend runs a multi-pass generate→compile→verify→repair loop and only returns the
// FINAL corrected PDF — the intermediate passes never reach the client. So these stages are
// a MOCK: they cycle on a timer to give the wait a believable, lively narrative. The text
// rolls upward in a 3D stack — the current step sits in front and centre, the one before it
// recedes up and back, and the next rises in from below.

import { useEffect, useState } from 'react'

// The fake journey. Order tells a plausible story; it loops until the PDF arrives.
const STEPS = [
  'Reading the job description',
  'Matching your experience to the role',
  'Surfacing the skills they want',
  'Rewriting your professional summary',
  'Ordering bullets by relevance',
  'Compiling the layout',
  'Making it fit one clean page',
  'Verifying every claim is grounded',
  'Polishing the final draft',
]

// Which relative slots we render around the active one (centre = 0).
const SLOTS = [-2, -1, 0, 1, 2]

// Depth styling per slot: the active line is large/sharp/front; neighbours shrink, fade,
// blur and sink backward in Z so the stack reads as 3D.
function slotStyle(offset) {
  const depth = Math.abs(offset)
  const y = offset * 56 // vertical spacing (px)
  const scale = 1 - depth * 0.16
  const z = -depth * 90 // push back in 3D
  // upcoming steps a touch brighter than past ones -> sense of forward motion
  const lead = offset === 0 ? 1 : offset > 0 ? 0.5 : 0.34
  const opacity = depth >= 2 ? lead * 0.4 : lead
  const blur = depth === 0 ? 0 : depth === 1 ? 0.6 : 1.6
  return {
    transform: `translate(-50%, -50%) translateY(${y}px) translateZ(${z}px) scale(${scale})`,
    opacity,
    filter: `blur(${blur}px)`,
    transition:
      'transform 700ms cubic-bezier(0.22,1,0.36,1), opacity 700ms ease, filter 700ms ease',
    willChange: 'transform, opacity',
  }
}

export default function GeneratingLoader() {
  const [active, setActive] = useState(0)

  useEffect(() => {
    const id = setInterval(() => setActive((a) => a + 1), 1900)
    return () => clearInterval(id)
  }, [])

  const n = STEPS.length

  return (
    <div className="absolute inset-0 overflow-hidden">
      {/* soft glow behind the stack */}
      <div className="pointer-events-none absolute left-1/2 top-1/2 h-60 w-60 -translate-x-1/2 -translate-y-1/2 rounded-full bg-emerald-500/10 blur-3xl" />

      {/* 3D rolling text stack */}
      <div
        className="absolute inset-0"
        style={{ perspective: '900px', transformStyle: 'preserve-3d' }}
      >
        {SLOTS.map((offset) => {
          const idx = active + offset
          const text = STEPS[((idx % n) + n) % n] // wrap so it loops forever
          const isActive = offset === 0
          return (
            <div
              key={idx} // absolute index -> persistent nodes glide between slots
              className="absolute left-1/2 top-1/2 w-full px-8 text-center"
              style={slotStyle(offset)}
            >
              <p
                className={
                  isActive
                    ? 'text-lg font-semibold text-white'
                    : 'text-base font-medium text-white/75'
                }
              >
                {isActive && (
                  <span className="mr-2 inline-block h-2 w-2 -translate-y-0.5 animate-pulse rounded-full bg-gradient-to-r from-blue-400 to-emerald-400 align-middle" />
                )}
                {text}
                {isActive && <span className="loader-dots" />}
              </p>
            </div>
          )
        })}
      </div>

      {/* shimmer bar + honest microcopy */}
      <div className="absolute inset-x-0 bottom-6 flex flex-col items-center gap-3 px-6 text-center">
        <span className="block h-1 w-40 overflow-hidden rounded-full bg-white/10">
          <span className="shimmer block h-full w-1/3 rounded-full bg-gradient-to-r from-blue-400 to-emerald-400" />
        </span>
        <p className="text-xs text-[var(--color-muted)]">
          Crafting a one-page, ATS-clean resume — this can take up to a minute.
        </p>
      </div>

      <style>{`
        @keyframes shimmerMove { 0% { transform: translateX(-120%); } 100% { transform: translateX(420%); } }
        .shimmer { animation: shimmerMove 1.25s ease-in-out infinite; }
        @keyframes loaderDots { 0%{content:'';} 25%{content:'.';} 50%{content:'..';} 75%,100%{content:'...';} }
        .loader-dots::after { content:''; animation: loaderDots 1.5s steps(1,end) infinite; }
      `}</style>
    </div>
  )
}
