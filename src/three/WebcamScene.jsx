import { Canvas, useFrame } from '@react-three/fiber'
import { useCallback, useEffect, useRef, useState } from 'react'
import * as THREE from 'three'
import Avatar from './Avatar'

function PointerTarget({ targetRef, headRef }) {
  useFrame(({ pointer }) => {
    const y = headRef.current?.y ?? 1.42
    targetRef.current.set(pointer.x * 1.6, y + pointer.y * 0.7, 2)
  })
  return null
}

function Framing({ headRef }) {
  useFrame(({ camera }) => {
    const head = headRef.current
    if (!head) return
    camera.position.set(0, head.y + 0.02, 1.45)
    camera.lookAt(0, head.y - 0.06, 0)
  })
  return null
}

export default function WebcamScene() {
  const container = useRef(null)
  const [visible, setVisible] = useState(false)
  const [mobile] = useState(() => window.matchMedia('(max-width: 767px), (pointer: coarse)').matches)
  const targetRef = useRef(new THREE.Vector3(0, 1.4, 2))
  const headRef = useRef(null)

  const handleReady = useCallback(({ head }) => {
    headRef.current = head
  }, [])

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => setVisible(entry.isIntersecting), { rootMargin: '200px' })
    observer.observe(container.current)
    return () => observer.disconnect()
  }, [])

  return (
    <div ref={container} className="absolute inset-0">
      <Canvas
        frameloop={visible ? 'always' : 'never'}
        dpr={mobile ? [1, 1.5] : [1, 2]}
        eventSource={document.getElementById('root')}
        eventPrefix="client"
        camera={{ fov: 24, position: [0, 1.32, 2.1] }}
        gl={{ alpha: true, antialias: !mobile }}
      >
        <ambientLight intensity={0.9} color="#c8c4ff" />
        <directionalLight position={[1.5, 2, 2]} intensity={1.6} color="#ffd9b0" />
        <directionalLight position={[-2, 1.5, -1]} intensity={1.2} color="#4fd1c5" />
        <PointerTarget targetRef={targetRef} headRef={headRef} />
        <Framing headRef={headRef} />
        <Avatar mode="stand" lookAtRef={targetRef} onReady={handleReady} />
      </Canvas>
    </div>
  )
}
