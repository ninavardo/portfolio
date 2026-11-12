import { Canvas, useFrame } from '@react-three/fiber'
import { Bloom, EffectComposer, ToneMapping, Vignette } from '@react-three/postprocessing'
import { ToneMappingMode } from 'postprocessing'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import * as THREE from 'three'
import Avatar from './Avatar'
import { WAVE_DURATION } from './motion'
import { drawKeyboardTexture, drawScreenTexture, seeded } from './city'
import Tbilisi from './Tbilisi'
import { scrollState } from '../scroll'

// Nina sits at the origin facing +X; the city lies toward -Z.
const SEAT_ROTATION = Math.PI / 2
const LID_TILT = 0.28
const RAIL = '#2f6b6f'
const RAIL_TRIM = '#5fa8a3'
const WOOD = '#7a4b2e'

const glow = (color, intensity) => new THREE.Color(color).multiplyScalar(intensity)

function Mat({ c, r = 0.75, m = 0 }) {
  return <meshStandardMaterial color={c} roughness={r} metalness={m} />
}

/* ---------------- Balcony ---------------- */

function Railing({ from, to, z }) {
  const length = to - from
  const posts = Math.round(length / 0.62)
  const step = length / posts
  const lattice = []
  for (let i = 0; i < posts; i++) {
    const cx = from + step * (i + 0.5)
    for (const dir of [1, -1]) lattice.push({ x: cx, rot: dir * 0.62 })
  }
  return (
    <group position={[0, 0, z]}>
      <mesh position={[(from + to) / 2, 1.0, 0]}>
        <boxGeometry args={[length + 0.1, 0.07, 0.12]} />
        <Mat c={RAIL_TRIM} />
      </mesh>
      <mesh position={[(from + to) / 2, 0.92, 0]}>
        <boxGeometry args={[length, 0.04, 0.08]} />
        <Mat c={RAIL} />
      </mesh>
      <mesh position={[(from + to) / 2, 0.12, 0]}>
        <boxGeometry args={[length, 0.06, 0.09]} />
        <Mat c={RAIL} />
      </mesh>
      {Array.from({ length: posts + 1 }, (_, i) => (
        <mesh key={i} position={[from + i * step, 0.55, 0]}>
          <boxGeometry args={[0.07, 1.0, 0.09]} />
          <Mat c={RAIL} />
        </mesh>
      ))}
      {lattice.map((l, i) => (
        <mesh key={i} position={[l.x, 0.52, 0]} rotation={[0, 0, l.rot]}>
          <boxGeometry args={[0.03, 0.95, 0.03]} />
          <Mat c={RAIL_TRIM} />
        </mesh>
      ))}
      {Array.from({ length: posts }, (_, i) => (
        <mesh key={`d${i}`} position={[from + step * (i + 0.5), 0.52, 0.02]} rotation={[0, 0, Math.PI / 4]}>
          <torusGeometry args={[0.08, 0.012, 6, 4]} />
          <Mat c="#d9c38f" />
        </mesh>
      ))}
    </group>
  )
}

function GrapeVine() {
  const leaves = useMemo(() => {
    const rnd = seeded(9)
    const list = []
    for (let i = 0; i < 46; i++) {
      const along = rnd()
      list.push({
        p: [-1.55 + along * 1.6 + (rnd() - 0.5) * 0.2, 1.0 + rnd() * 0.18 + (along < 0.15 ? rnd() * 1.4 : 0), -0.92 + (rnd() - 0.5) * 0.1],
        r: [rnd() * 3, rnd() * 3, rnd() * 3],
        s: 0.07 + rnd() * 0.06,
        c: rnd() > 0.5 ? '#2f6b3a' : '#3f8a46',
      })
    }
    return list
  }, [])
  return (
    <group>
      {leaves.map((l, i) => (
        <mesh key={i} position={l.p} rotation={l.r} scale={[1, 0.25, 1]}>
          <sphereGeometry args={[l.s, 8, 6]} />
          <Mat c={l.c} />
        </mesh>
      ))}
      {[[-0.9, 0.9], [-0.4, 0.88]].map(([x, y]) =>
        Array.from({ length: 7 }, (_, i) => (
          <mesh key={`${x}${i}`} position={[x + ((i % 3) - 1) * 0.03, y - Math.floor(i / 3) * 0.04, -0.86]}>
            <sphereGeometry args={[0.022, 8, 6]} />
            <Mat c="#5b2a6e" r={0.3} />
          </mesh>
        )),
      )}
    </group>
  )
}

function StringLights() {
  const bulbs = useMemo(() => {
    const list = []
    for (let i = 0; i <= 16; i++) {
      const t = i / 16
      const x = -1.55 + t * 3.9
      list.push([x, 2.3 - Math.sin(t * Math.PI) * 0.28, -0.82])
    }
    return list
  }, [])
  const curve = useMemo(() => new THREE.CatmullRomCurve3(bulbs.map((b) => new THREE.Vector3(b[0], b[1] + 0.04, b[2]))), [bulbs])
  return (
    <group>
      <mesh>
        <tubeGeometry args={[curve, 64, 0.006, 4, false]} />
        <meshBasicMaterial color="#1a1a1a" />
      </mesh>
      {bulbs.map((b, i) => (
        <mesh key={i} position={b}>
          <sphereGeometry args={[0.035, 10, 8]} />
          <meshBasicMaterial color={glow('#ffc070', 3.2)} toneMapped={false} />
        </mesh>
      ))}
      <pointLight position={[0.4, 2.1, -0.6]} color="#ffb06a" intensity={2.2} distance={4} decay={1.6} />
    </group>
  )
}

function Churchkhela() {
  const strings = [
    { x: -1.42, z: 0.3, n: 9, c: '#8a3b2a' },
    { x: -1.42, z: 0.5, n: 7, c: '#b3612f' },
    { x: -1.42, z: 0.7, n: 8, c: '#6b2d3c' },
  ]
  return strings.map((s) => (
    <group key={s.z} position={[s.x, 2.32, s.z]}>
      <mesh position={[0, 0.06, 0]}>
        <cylinderGeometry args={[0.004, 0.004, 0.12, 4]} />
        <meshBasicMaterial color="#3a2a1a" />
      </mesh>
      {Array.from({ length: s.n }, (_, i) => (
        <mesh key={i} position={[0, -i * 0.065, 0]} scale={[1, 1.2, 1]}>
          <sphereGeometry args={[0.035, 10, 8]} />
          <Mat c={s.c} r={0.45} />
        </mesh>
      ))}
    </group>
  ))
}

function Structure() {
  return (
    <group>
      <mesh position={[0.4, -0.05, 0.3]} receiveShadow>
        <boxGeometry args={[4.1, 0.1, 2.5]} />
        <Mat c="#5a3a26" />
      </mesh>
      {Array.from({ length: 11 }, (_, i) => (
        <mesh key={i} position={[0.4, 0.002, -0.9 + i * 0.22]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[4.1, 0.01]} />
          <meshBasicMaterial color="#3e2718" />
        </mesh>
      ))}
      <Railing from={-1.55} to={2.4} z={-0.92} />
      <mesh position={[2.42, 1.2, -0.92]}>
        <boxGeometry args={[0.1, 2.4, 0.1]} />
        <Mat c={RAIL} />
      </mesh>
      <mesh position={[0.4, 2.42, -0.92]}>
        <boxGeometry args={[4.1, 0.1, 0.12]} />
        <Mat c={RAIL} />
      </mesh>
      {/* The house wall behind Nina, with a lit doorway. */}
      <mesh position={[-1.62, 1.3, 0.3]}>
        <boxGeometry args={[0.12, 2.8, 2.6]} />
        <Mat c="#d9c7a8" r={0.95} />
      </mesh>
      <mesh position={[-1.55, 1.05, 0.55]}>
        <boxGeometry args={[0.04, 1.9, 0.9]} />
        <meshBasicMaterial color={glow('#ffb35c', 1.15)} toneMapped={false} />
      </mesh>
      <mesh position={[-1.54, 1.05, 0.55]}>
        <boxGeometry args={[0.05, 1.98, 0.06]} />
        <Mat c={WOOD} />
      </mesh>
      <pointLight position={[-1.2, 1.4, 0.55]} color="#ffa552" intensity={1.6} distance={3.5} decay={1.6} />
      <GrapeVine />
      <StringLights />
      <Churchkhela />
    </group>
  )
}

/* ---------------- Seat: chair, table, laptop ---------------- */

function useScreenTexture() {
  const texture = useMemo(() => {
    const canvas = document.createElement('canvas')
    canvas.width = 1024
    canvas.height = 640
    drawScreenTexture(canvas)
    const tex = new THREE.CanvasTexture(canvas)
    tex.colorSpace = THREE.SRGBColorSpace
    tex.anisotropy = 8
    return tex
  }, [])
  useEffect(() => {
    document.fonts.ready.then(() => {
      drawScreenTexture(texture.image)
      texture.needsUpdate = true
    })
  }, [texture])
  return texture
}

function Laptop({ position }) {
  const texture = useScreenTexture()
  const keys = useMemo(() => {
    const canvas = document.createElement('canvas')
    canvas.width = 1024
    canvas.height = 460
    drawKeyboardTexture(canvas)
    const tex = new THREE.CanvasTexture(canvas)
    tex.colorSpace = THREE.SRGBColorSpace
    tex.anisotropy = 8
    return tex
  }, [])
  return (
    <group position={position}>
      <mesh position={[0, 0.008, 0]} castShadow>
        <boxGeometry args={[0.34, 0.016, 0.24]} />
        <Mat c="#b9bcc6" r={0.35} m={0.6} />
      </mesh>
      <mesh position={[0, 0.0166, 0.008]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[0.31, 0.14]} />
        <meshStandardMaterial map={keys} roughness={0.6} emissiveMap={keys} emissive="#ffb070" emissiveIntensity={0.12} />
      </mesh>
      <mesh position={[0, 0.0166, -0.088]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[0.11, 0.045]} />
        <Mat c="#a7aab4" r={0.25} m={0.5} />
      </mesh>
      <group position={[0, 0.016, 0.12]} rotation={[LID_TILT, 0, 0]}>
        <mesh position={[0, 0.11, 0]}>
          <boxGeometry args={[0.34, 0.22, 0.008]} />
          <Mat c="#b9bcc6" r={0.35} m={0.6} />
        </mesh>
        <mesh position={[0, 0.11, -0.0045]} rotation={[0, Math.PI, 0]}>
          <planeGeometry args={[0.31, 0.194]} />
          <meshBasicMaterial map={texture} toneMapped={false} />
        </mesh>
      </group>
      <pointLight position={[0, 0.16, -0.12]} color="#9db4ff" intensity={0.9} distance={1.4} decay={1.5} />
    </group>
  )
}

function Chair({ seatY, z }) {
  return (
    <group position={[0, 0, z]}>
      <mesh position={[0, seatY - 0.02, 0]} castShadow>
        <cylinderGeometry args={[0.21, 0.2, 0.04, 24]} />
        <Mat c={WOOD} r={0.6} />
      </mesh>
      {[[-1, -1], [1, -1], [-1, 1], [1, 1]].map(([sx, sz]) => (
        <mesh key={`${sx}${sz}`} position={[sx * 0.13, (seatY - 0.04) / 2, sz * 0.13]} rotation={[sz * 0.06, 0, -sx * 0.06]}>
          <cylinderGeometry args={[0.014, 0.018, seatY - 0.04, 8]} />
          <Mat c={WOOD} r={0.6} />
        </mesh>
      ))}
      <mesh position={[0, seatY + 0.28, -0.19]} rotation={[0, 0, 0]}>
        <torusGeometry args={[0.15, 0.014, 8, 24, Math.PI]} />
        <Mat c={WOOD} r={0.6} />
      </mesh>
      {[-1, 1].map((s) => (
        <mesh key={s} position={[s * 0.15, seatY + 0.14, -0.19]}>
          <cylinderGeometry args={[0.014, 0.014, 0.3, 8]} />
          <Mat c={WOOD} r={0.6} />
        </mesh>
      ))}
    </group>
  )
}

function Table({ topY, z }) {
  return (
    <group position={[0, 0, z]}>
      <mesh position={[0, topY - 0.015, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.4, 0.4, 0.03, 40]} />
        <Mat c="#e9e2d6" r={0.4} />
      </mesh>
      <mesh position={[0, (topY - 0.03) / 2, 0]}>
        <cylinderGeometry args={[0.02, 0.02, topY - 0.03, 10]} />
        <Mat c="#1d1f26" r={0.4} m={0.6} />
      </mesh>
      <mesh position={[0, 0.015, 0]}>
        <cylinderGeometry args={[0.2, 0.22, 0.03, 24]} />
        <Mat c="#1d1f26" r={0.4} m={0.6} />
      </mesh>
      {/* A glass of Georgian red wine. */}
      <group position={[-0.24, topY, 0.12]}>
        <mesh position={[0, 0.05, 0]}>
          <cylinderGeometry args={[0.028, 0.022, 0.1, 16, 1, true]} />
          <meshStandardMaterial color="#ffffff" transparent opacity={0.25} roughness={0.05} side={THREE.DoubleSide} />
        </mesh>
        <mesh position={[0, 0.03, 0]}>
          <cylinderGeometry args={[0.025, 0.021, 0.055, 16]} />
          <meshStandardMaterial color="#6e0f22" roughness={0.2} />
        </mesh>
      </group>
      <group position={[0.24, topY, 0.05]}>
        <mesh position={[0, 0.04, 0]}>
          <cylinderGeometry args={[0.05, 0.04, 0.08, 16]} />
          <Mat c="#c4623f" />
        </mesh>
        {[0, 1, 2, 3, 4].map((i) => (
          <mesh key={i} position={[Math.cos(i * 1.3) * 0.025, 0.11 + (i % 2) * 0.02, Math.sin(i * 1.3) * 0.025]} scale={[0.6, 1.3, 0.6]}>
            <sphereGeometry args={[0.03, 8, 6]} />
            <Mat c="#4c9a52" />
          </mesh>
        ))}
      </group>
    </group>
  )
}

function Seat({ waveRef, attentionRef, lookAtRef, onLayout, onModelReady }) {
  const [layout, setLayout] = useState(null)

  const handleReady = useCallback(
    ({ hips, leftHand, rightHand }) => {
      const handY = (leftHand.y + rightHand.y) / 2
      const handZ = (leftHand.z + rightHand.z) / 2
      const deckY = handY - 0.05
      const deckZ = handZ + 0.055
      const next = {
        seatY: hips.y - 0.08,
        chairZ: hips.z - 0.02,
        tableY: deckY,
        tableZ: deckZ + 0.12,
        laptop: [ (leftHand.x + rightHand.x) / 2, deckY, deckZ ],
      }
      setLayout(next)

      const lidHinge = new THREE.Vector3(next.laptop[0], deckY + 0.016, deckZ + 0.12)
      const lidUp = new THREE.Vector3(0, 1, 0).applyAxisAngle(new THREE.Vector3(1, 0, 0), LID_TILT)
      const local = lidHinge.clone().addScaledVector(lidUp, 0.11)
      const normal = new THREE.Vector3(0, 0, -1).applyAxisAngle(new THREE.Vector3(1, 0, 0), LID_TILT)
      const seatRot = new THREE.Euler(0, SEAT_ROTATION, 0)
      onLayout({
        screen: local.applyEuler(seatRot),
        normal: normal.applyEuler(seatRot),
      })
      onModelReady()
    },
    [onLayout, onModelReady],
  )

  return (
    <group rotation={[0, SEAT_ROTATION, 0]}>
      <Avatar mode="sit" waveRef={waveRef} attentionRef={attentionRef} lookAtRef={lookAtRef} onReady={handleReady} />
      {layout && (
        <>
          <Chair seatY={layout.seatY} z={layout.chairZ} />
          <Table topY={layout.tableY} z={layout.tableZ} />
          <Laptop position={layout.laptop} />
        </>
      )}
    </group>
  )
}

/* ---------------- Camera ---------------- */

const START_POS = new THREE.Vector3(2.35, 1.5, 3.0)
const START_POS_MOBILE = new THREE.Vector3(2.9, 1.75, 4.4)
const START_TARGET = new THREE.Vector3(0.25, 0.95, -0.25)

const tmpPos = new THREE.Vector3()
const tmpTarget = new THREE.Vector3()

function CameraRig({ layoutRef, waveRef, attentionRef, lookAtRef }) {
  const path = useRef(null)
  const look = useRef(START_TARGET.clone())
  const wentDeep = useRef(false)

  useFrame((state, delta) => {
    const { camera, size, pointer } = state
    const mobile = size.width < 768
    const p = scrollState.dive

    attentionRef.current = 1 - THREE.MathUtils.smoothstep(p, 0.02, 0.15)
    lookAtRef.current = camera.position
    if (p > 0.3) wentDeep.current = true
    const now = performance.now() / 1000
    if (wentDeep.current && p < 0.02 && now - waveRef.current > WAVE_DURATION + 0.5) {
      wentDeep.current = false
      waveRef.current = now + 0.25
    }

    const layout = layoutRef.current
    if (layout && (!path.current || path.current.mobile !== mobile)) {
      const { screen, normal } = layout
      const end = screen.clone().addScaledVector(normal, 0.3)
      const side = new THREE.Vector3(0, 0, 1)
      path.current = {
        mobile,
        end,
        screen,
        curve: new THREE.CatmullRomCurve3(
          [
            (mobile ? START_POS_MOBILE : START_POS).clone(),
            new THREE.Vector3(1.1, 1.55, 2.0),
            screen.clone().addScaledVector(normal, 1.1).addScaledVector(side, 0.75).setY(screen.y + 0.5),
            screen.clone().addScaledVector(normal, 0.7).addScaledVector(side, 0.35).setY(screen.y + 0.2),
            end,
          ],
          false,
          'centripetal',
        ),
      }
    }

    const u = THREE.MathUtils.smootherstep(p, 0.08, 0.95)
    if (path.current) {
      path.current.curve.getPointAt(u, tmpPos)
      tmpTarget.lerpVectors(START_TARGET, path.current.screen, THREE.MathUtils.smoothstep(u, 0, 0.75))
    } else {
      tmpPos.copy(mobile ? START_POS_MOBILE : START_POS)
      tmpTarget.copy(START_TARGET)
    }
    const sway = 1 - u
    tmpPos.x += pointer.x * 0.25 * sway
    tmpPos.y += pointer.y * 0.12 * sway

    const k = 1 - Math.exp(-6 * delta)
    camera.position.lerp(tmpPos, k)
    look.current.lerp(tmpTarget, k)
    camera.lookAt(look.current)

    const shiftX = mobile ? 0 : size.width * 0.15 * sway
    const shiftY = mobile ? -size.height * 0.14 * sway : 0
    camera.setViewOffset(size.width, size.height, -shiftX, shiftY, size.width, size.height)
  })
  return null
}

export default function BalconyScene({ ready = false, active = true }) {
  const layoutRef = useRef(null)
  const waveRef = useRef(-99)
  const attentionRef = useRef(1)
  const lookAtRef = useRef(null)
  const handleLayout = useCallback((layout) => {
    layoutRef.current = layout
  }, [])
  const [mobile] = useState(() => window.matchMedia('(max-width: 767px), (pointer: coarse)').matches)

  const [modelReady, setModelReady] = useState(false)
  const handleModelReady = useCallback(() => setModelReady(true), [])

  useEffect(() => {
    if (ready && modelReady) waveRef.current = performance.now() / 1000 + 0.7
  }, [ready, modelReady])

  return (
    <Canvas
      frameloop={active ? 'always' : 'never'}
      dpr={mobile ? [1, 1.5] : [1, 1.75]}
      camera={{ fov: 35, near: 0.02, far: 600, position: START_POS.toArray() }} gl={{ antialias: false, powerPreference: 'high-performance' }}>
      <color attach="background" args={['#070b1f']} />
      <fog attach="fog" args={['#151236', 30, 270]} />
      <ambientLight intensity={0.55} color="#8f9cff" />
      <hemisphereLight args={['#6f7bd6', '#2a1d3f', 0.6]} />
      <directionalLight position={[-4, 6, 3]} intensity={0.9} color="#b9c4ff" />
      <directionalLight position={[3, 2, 4]} intensity={0.55} color="#ffc69a" />
      <Tbilisi mobile={mobile} />
      <Structure />
      <Seat waveRef={waveRef} attentionRef={attentionRef} lookAtRef={lookAtRef} onLayout={handleLayout} onModelReady={handleModelReady} />
      <CameraRig layoutRef={layoutRef} waveRef={waveRef} attentionRef={attentionRef} lookAtRef={lookAtRef} />
      <EffectComposer multisampling={mobile ? 0 : 4}>
        <Bloom mipmapBlur intensity={1.1} luminanceThreshold={0.9} luminanceSmoothing={0.15} />
        <Vignette eskil={false} offset={0.2} darkness={0.6} />
        <ToneMapping mode={ToneMappingMode.AGX} />
      </EffectComposer>
    </Canvas>
  )
}
