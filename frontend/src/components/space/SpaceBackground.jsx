// Shared cosmic backdrop: React Bits WebGL particles (blue/green/white stars) fixed
// behind everything on pitch black. pointer-events-none so it never blocks clicks.

import Particles from '../Particles'

export default function SpaceBackground() {
  return (
    <div className="pointer-events-none fixed inset-0 -z-10 bg-black">
      <Particles
        particleColors={['#3b82f6', '#10b981', '#60a5fa', '#ffffff']}
        particleCount={260}
        particleSpread={12}
        speed={0.05}
        particleBaseSize={64}
        sizeRandomness={1}
        alphaParticles
        disableRotation={false}
      />
    </div>
  )
}
