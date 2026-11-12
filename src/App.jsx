import { useCallback, useEffect, useState } from 'react'
import { getLenis, initSmoothScroll, ScrollTrigger } from './scroll'
import BootLoader from './components/BootLoader'
import MenuBar from './components/MenuBar'
import Hero from './components/Hero'
import Desktop from './components/os/Desktop'

export default function App() {
  const [ready, setReady] = useState(false)
  const [bootGone, setBootGone] = useState(false)

  useEffect(() => {
    history.scrollRestoration = 'manual'
    window.scrollTo(0, 0)
    return initSmoothScroll()
  }, [])

  useEffect(() => {
    const lenis = getLenis()
    if (!lenis) return
    if (ready) {
      lenis.start()
      ScrollTrigger.refresh()
    } else {
      lenis.stop()
    }
  }, [ready])

  const handleBooted = useCallback(() => {
    setReady(true)
    setTimeout(() => setBootGone(true), 1200)
  }, [])

  return (
    <>
      {!bootGone && <BootLoader onDone={handleBooted} />}
      <MenuBar />
      <main>
        <Hero ready={ready} />
        <Desktop />
      </main>
    </>
  )
}
