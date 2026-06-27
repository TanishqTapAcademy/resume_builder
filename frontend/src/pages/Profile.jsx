// Profile page. Loads the user's profile; if none, shows the two-door setup. Once a
// profile exists: clean display (left) + session chat editor (right), with a raw-JSON
// escape hatch. All saves go through PUT /profile.

import { useEffect, useState } from 'react'
import { Loader2, Pencil, Code2 } from 'lucide-react'

import { getProfile, saveProfile } from '../services/api'
import SpaceBackground from '../components/space/SpaceBackground'
import AppHeader from '../components/AppHeader'
import ProfileSeed from '../components/profile/ProfileSeed'
import ProfileView from '../components/profile/ProfileView'
import ProfileChat from '../components/profile/ProfileChat'
import RawEditor from '../components/profile/RawEditor'
import SupportCard from '../components/SupportCard'

export default function Profile() {
  const [state, setState] = useState({ status: 'loading', profile: null })
  const [showRaw, setShowRaw] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    getProfile()
      .then((p) => setState({ status: p ? 'ready' : 'empty', profile: p }))
      .catch((err) => {
        setError(err.message)
        setState({ status: 'error', profile: null })
      })
  }, [])

  // Persist edited profile data (chat-approved merge or raw edit) and update view.
  async function persist(newData) {
    const saved = await saveProfile(newData)
    setState({ status: 'ready', profile: saved })
    return saved
  }

  const data = state.profile?.data

  return (
    <div className="relative min-h-screen pb-16">
      <SpaceBackground />
      <AppHeader />

      <main className="mx-auto max-w-6xl px-4 py-10">
        {state.status === 'loading' && (
          <div className="flex items-center justify-center gap-2 py-24 text-[var(--color-muted)]">
            <Loader2 className="h-5 w-5 animate-spin" /> Loading your profile…
          </div>
        )}

        {state.status === 'error' && (
          <p className="py-24 text-center text-red-300">{error}</p>
        )}

        {state.status === 'empty' && (
          <ProfileSeed onSeeded={(p) => setState({ status: 'ready', profile: p })} />
        )}

        {state.status === 'ready' && (
          <>
            <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
              <div>
                <h1 className="text-2xl font-bold tracking-tight text-white">
                  Your profile
                </h1>
                <p className="text-sm text-[var(--color-muted)]">
                  Source: {state.profile.source}
                  {state.profile.hasTemplate && ' · template saved'}
                </p>
              </div>
              <button
                onClick={() => setShowRaw(true)}
                className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--color-border)] px-3 py-2 text-sm text-white/90 transition hover:bg-white/5"
              >
                <Code2 className="h-4 w-4" /> Edit JSON
              </button>
            </div>

            <div className="grid items-start gap-6 lg:grid-cols-[1.4fr_1fr]">
              <div className="glass rounded-2xl p-6">
                <ProfileView data={data} />
              </div>
              <div className="space-y-6 lg:sticky lg:top-6">
                <ProfileChat profile={data} onApply={persist} />
                <SupportCard />
              </div>
            </div>
          </>
        )}
      </main>

      {showRaw && (
        <RawEditor data={data} onSave={persist} onClose={() => setShowRaw(false)} />
      )}
    </div>
  )
}
