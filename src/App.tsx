import { MotionConfig } from 'motion/react'
import { useEffect, useState } from 'react'
import { Footer, Nav } from './components/Chrome'
import Landing from './pages/Landing'
import Workspace from './pages/Workspace'

type View = 'landing' | 'workspace'
const viewFromHash = (): View => (window.location.hash.startsWith('#/workspace') ? 'workspace' : 'landing')

export default function App() {
  const [view, setView] = useState<View>(viewFromHash)

  useEffect(() => {
    const onHash = () => {
      const next = viewFromHash()
      setView((cur) => {
        if (cur !== next) window.scrollTo({ top: 0 })
        return next
      })
    }
    window.addEventListener('hashchange', onHash)
    return () => window.removeEventListener('hashchange', onHash)
  }, [])

  return (
    <MotionConfig reducedMotion="user">
      <div className="flex min-h-dvh flex-col">
        <Nav view={view} />
        <div className="flex-1">{view === 'landing' ? <Landing /> : <Workspace />}</div>
        <Footer view={view} />
      </div>
    </MotionConfig>
  )
}
