// Two modes: Tailor (the product) and Advanced (raw LaTeX escape hatch).
// App only owns which view is showing; each view owns its own state/hooks.

import { useState } from 'react'

import TopBar from './components/TopBar'
import TailorView from './views/TailorView'
import AdvancedView from './views/AdvancedView'

export default function App() {
  const [view, setView] = useState('tailor')

  return (
    <div className="h-full flex flex-col">
      <TopBar view={view} onView={setView} />
      {view === 'tailor' ? <TailorView /> : <AdvancedView />}
    </div>
  )
}
