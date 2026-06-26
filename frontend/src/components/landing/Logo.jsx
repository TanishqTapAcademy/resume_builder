// Brand wordmark — the logo mark + name. Reused in navbar, auth, footer.

import logo from '../../assets/logo.png'

export default function Logo({ size = 'md' }) {
  const dim = size === 'lg' ? 'h-11 w-11' : 'h-9 w-9'
  const text = size === 'lg' ? 'text-xl' : 'text-base'
  return (
    <div className="flex items-center gap-2.5">
      <img
        src={logo}
        alt="ResumeOS logo"
        className={`${dim} rounded-xl object-contain shadow-[0_0_24px_-4px_rgba(59,130,246,0.7)]`}
      />
      <span className={`${text} font-semibold tracking-tight text-white`}>
        Resume<span className="text-gradient">OS</span>
      </span>
    </div>
  )
}
