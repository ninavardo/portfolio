import { useFrame } from '@react-three/fiber'
import { Stars } from '@react-three/drei'
import { useEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import { createCity, createTerrainGeometry, KARTLIS_DEDA, MTATSMINDA, NARIKALA, narikalaCrest, RIVER_Z, terrainHeight } from './city'

const glow = (color, intensity) => new THREE.Color(color).multiplyScalar(intensity)
const FACE_CAMERA = 0.57
const UP = new THREE.Vector3(0, 1, 0)

// Shared clock uniform for every animated city shader.
const cityTime = { value: 0 }

function CityClock() {
  useFrame((_, delta) => {
    cityTime.value += delta
  })
  return null
}

/* ---------------- Sky ---------------- */

function Sky() {
  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        side: THREE.BackSide,
        depthWrite: false,
        fog: false,
        vertexShader: /* glsl */ `
          varying vec3 vDir;
          void main() {
            vDir = normalize(position);
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          }
        `,
        fragmentShader: /* glsl */ `
          varying vec3 vDir;
          void main() {
            float h = vDir.y;
            vec3 top = vec3(0.025, 0.035, 0.11);
            vec3 mid = vec3(0.10, 0.07, 0.22);
            vec3 horizon = vec3(0.42, 0.18, 0.30);
            vec3 col = mix(horizon, mid, smoothstep(-0.05, 0.14, h));
            col = mix(col, top, smoothstep(0.14, 0.6, h));
            gl_FragColor = vec4(col, 1.0);
          }
        `,
      }),
    [],
  )
  return (
    <mesh material={material}>
      <sphereGeometry args={[300, 32, 16]} />
    </mesh>
  )
}

function softTexture(draw, w = 256, h = 128) {
  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  draw(canvas.getContext('2d'), w, h)
  const tex = new THREE.CanvasTexture(canvas)
  tex.colorSpace = THREE.SRGBColorSpace
  return tex
}

function Clouds() {
  const texture = useMemo(
    () =>
      softTexture((ctx, w, h) => {
        const blobs = [
          [0.25, 0.6, 0.22],
          [0.42, 0.45, 0.26],
          [0.6, 0.55, 0.24],
          [0.76, 0.62, 0.18],
          [0.5, 0.68, 0.3],
        ]
        for (const [x, y, r] of blobs) {
          const g = ctx.createRadialGradient(x * w, y * h, 0, x * w, y * h, r * w)
          g.addColorStop(0, 'rgba(255,255,255,0.55)')
          g.addColorStop(1, 'rgba(255,255,255,0)')
          ctx.fillStyle = g
          ctx.fillRect(0, 0, w, h)
        }
      }),
    [],
  )
  const clouds = useRef([])
  const specs = useMemo(
    () => [
      { x: -95, y: 19, z: -185, s: 46, speed: 0.32, opacity: 0.2 },
      { x: -30, y: 25, z: -200, s: 60, speed: 0.2, opacity: 0.14 },
      { x: -140, y: 14, z: -170, s: 34, speed: 0.42, opacity: 0.16 },
    ],
    [],
  )
  useFrame((_, delta) => {
    clouds.current.forEach((m, i) => {
      if (!m) return
      m.position.x += specs[i].speed * delta
      if (m.position.x > 50) m.position.x = -170
    })
  })
  return specs.map((c, i) => (
    <mesh key={i} ref={(m) => (clouds.current[i] = m)} position={[c.x, c.y, c.z]} rotation={[0, FACE_CAMERA, 0]} renderOrder={-1}>
      <planeGeometry args={[c.s, c.s * 0.32]} />
      <meshBasicMaterial map={texture} color="#b8a3dc" transparent opacity={c.opacity} depthWrite={false} fog={false} />
    </mesh>
  ))
}

function Birds() {
  const group = useRef(null)
  const birds = useRef([])
  const geometry = useMemo(() => {
    const g = new THREE.BufferGeometry()
    g.setAttribute('position', new THREE.Float32BufferAttribute([0, 0, 0, -0.55, 0.12, -0.1, -0.2, 0.02, 0, 0, 0, 0, 0.2, 0.02, 0, 0.55, 0.12, -0.1], 3))
    return g
  }, [])
  const flock = useMemo(
    () => [
      [0, 0, 0],
      [-1.3, -0.5, 0.6],
      [-2.4, 0.3, -0.4],
      [-1.0, 0.9, 1.1],
      [-3.4, -0.2, 0.5],
    ],
    [],
  )
  const from = useMemo(() => new THREE.Vector3(-36, 5, -32), [])
  const to = useMemo(() => new THREE.Vector3(-2, 9, -52), [])
  useFrame(({ clock }) => {
    const t = clock.elapsedTime % 50
    const u = t / 30
    const g = group.current
    g.visible = u <= 1
    if (!g.visible) return
    g.position.lerpVectors(from, to, u)
    g.position.y += Math.sin(u * Math.PI * 2) * 0.8
    birds.current.forEach((b, i) => {
      if (b) b.scale.y = 0.4 + 0.6 * Math.abs(Math.sin(clock.elapsedTime * (5.5 + i * 0.4) + i))
    })
  })
  return (
    <group ref={group} rotation={[0, -0.6, 0]}>
      {flock.map((p, i) => (
        <mesh key={i} ref={(m) => (birds.current[i] = m)} geometry={geometry} position={p}>
          <meshBasicMaterial color="#0b0a1d" side={THREE.DoubleSide} fog={false} />
        </mesh>
      ))}
    </group>
  )
}

/* ---------------- Ground, haze, river ---------------- */

function Terrain() {
  const geometry = useMemo(() => createTerrainGeometry(), [])
  return (
    <mesh geometry={geometry}>
      <meshStandardMaterial color="#0d1030" roughness={1} />
    </mesh>
  )
}

function Haze() {
  const texture = useMemo(
    () =>
      softTexture(
        (ctx, w, h) => {
          const g = ctx.createLinearGradient(0, h, 0, 0)
          g.addColorStop(0, 'rgba(255,255,255,0.9)')
          g.addColorStop(0.45, 'rgba(255,255,255,0.35)')
          g.addColorStop(1, 'rgba(255,255,255,0)')
          ctx.fillStyle = g
          ctx.fillRect(0, 0, w, h)
        },
        8,
        128,
      ),
    [],
  )
  const layers = [
    { d: 45, y: -12, h: 9, color: '#2a1f4d', opacity: 0.22 },
    { d: 88, y: -11, h: 12, color: '#33244f', opacity: 0.28 },
    { d: 122, y: -9, h: 14, color: '#3d2855', opacity: 0.32 },
  ]
  return layers.map((l) => (
    <mesh key={l.d} position={[-0.43 * l.d, l.y + l.h / 2, -0.9 * l.d]} rotation={[0, FACE_CAMERA, 0]} renderOrder={1}>
      <planeGeometry args={[320, l.h]} />
      <meshBasicMaterial map={texture} color={l.color} transparent opacity={l.opacity} depthWrite={false} fog={false} />
    </mesh>
  ))
}

function River() {
  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        fog: true,
        uniforms: THREE.UniformsUtils.merge([THREE.UniformsLib.fog, { uTime: cityTime }]),
        vertexShader: /* glsl */ `
          varying vec2 vXZ;
          #include <fog_pars_vertex>
          void main() {
            vec4 world = modelMatrix * vec4(position, 1.0);
            vXZ = world.xz;
            vec4 mvPosition = viewMatrix * world;
            gl_Position = projectionMatrix * mvPosition;
            #include <fog_vertex>
          }
        `,
        fragmentShader: /* glsl */ `
          uniform float uTime;
          varying vec2 vXZ;
          #include <fog_pars_fragment>
          float hash(float n) { return fract(sin(n) * 43758.5453); }
          void main() {
            float lane = floor(vXZ.x * 0.45);
            float h = hash(lane);
            float streak = step(0.55, h) * smoothstep(0.5, 0.0, abs(fract(vXZ.x * 0.45) - 0.5));
            float shimmer = 0.55 + 0.45 * sin(uTime * (1.5 + h * 2.0) + vXZ.y * 6.0 + h * 30.0);
            vec3 warm = mix(vec3(1.6, 0.9, 0.35), vec3(1.2, 1.2, 1.5), step(0.85, h));
            vec3 col = vec3(0.04, 0.05, 0.13) + warm * streak * shimmer * 0.7;
            gl_FragColor = vec4(col, 1.0);
            #include <fog_fragment>
          }
        `,
      }),
    [],
  )
  return (
    <mesh material={material} position={[0, terrainHeight(0, RIVER_Z) + 0.45, RIVER_Z]} rotation={[-Math.PI / 2, 0, 0]}>
      <planeGeometry args={[320, 7]} />
    </mesh>
  )
}

/* ---------------- Houses and lights ---------------- */

const houseMaterial = new THREE.ShaderMaterial({
  fog: true,
  uniforms: THREE.UniformsUtils.merge([THREE.UniformsLib.fog, { uTime: cityTime }]),
  vertexShader: /* glsl */ `
    attribute vec3 aScale;
    attribute float aSeed;
    varying vec3 vLocal;
    varying vec3 vNormal;
    varying vec3 vScale;
    varying float vSeed;
    #include <fog_pars_vertex>
    void main() {
      vLocal = position;
      vNormal = normal;
      vScale = aScale;
      vSeed = aSeed;
      vec4 mvPosition = modelViewMatrix * instanceMatrix * vec4(position, 1.0);
      gl_Position = projectionMatrix * mvPosition;
      #include <fog_vertex>
    }
  `,
  fragmentShader: /* glsl */ `
    uniform float uTime;
    varying vec3 vLocal;
    varying vec3 vNormal;
    varying vec3 vScale;
    varying float vSeed;
    #include <fog_pars_fragment>
    float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
    void main() {
      vec3 n = normalize(vNormal);
      vec3 wall = mix(vec3(0.03, 0.028, 0.055), vec3(0.06, 0.045, 0.055), vSeed);
      vec3 col = wall * (0.7 + 0.25 * n.z + 0.12 * n.x);
      if (n.y > 0.5) {
        col = vec3(0.045, 0.03, 0.04);
      } else if (n.y > -0.5) {
        bool side = abs(n.x) > 0.5;
        vec2 uv = side ? vec2(vLocal.z, vLocal.y) : vec2(vLocal.x, vLocal.y);
        float faceW = side ? vScale.z : vScale.x;
        vec2 cells = vec2(max(1.0, floor(faceW / 0.7)), max(1.0, floor(vScale.y / 0.85)));
        vec2 p = (uv + 0.5) * cells;
        vec2 id = floor(p) + n.xz * 17.0 + vSeed * 91.0;
        vec2 f = fract(p);
        float win = step(0.28, f.x) * step(f.x, 0.72) * step(0.32, f.y) * step(f.y, 0.78);
        float h = hash(id);
        float lit = step(0.5, h);
        float toggle = step(0.992, hash(id + floor(uTime * 0.12 + h * 40.0)));
        lit = abs(lit - toggle);
        vec3 warm = mix(vec3(2.3, 1.35, 0.45), vec3(2.5, 1.85, 1.05), hash(id + 3.1));
        col = mix(col, warm * (0.7 + 0.3 * h), win * lit);
        col = mix(col, vec3(0.025, 0.025, 0.05), win * (1.0 - lit) * 0.6);
      }
      gl_FragColor = vec4(col, 1.0);
      #include <fog_fragment>
    }
  `,
})

const lightsMaterial = new THREE.ShaderMaterial({
  fog: true,
  transparent: true,
  depthWrite: false,
  blending: THREE.AdditiveBlending,
  uniforms: THREE.UniformsUtils.merge([THREE.UniformsLib.fog, { uTime: cityTime, uScale: { value: 1000 } }]),
  vertexShader: /* glsl */ `
    attribute vec3 lampColor;
    attribute float phase;
    attribute float size;
    uniform float uTime;
    uniform float uScale;
    varying vec3 vColor;
    #include <fog_pars_vertex>
    void main() {
      float twinkle = 0.72 + 0.28 * sin(uTime * (0.8 + fract(phase) * 2.6) + phase * 7.0);
      vColor = lampColor * twinkle;
      vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
      gl_PointSize = max(1.5, size * 0.22 * uScale / -mvPosition.z);
      gl_Position = projectionMatrix * mvPosition;
      #include <fog_vertex>
    }
  `,
  fragmentShader: /* glsl */ `
    varying vec3 vColor;
    #include <fog_pars_fragment>
    void main() {
      float d = length(gl_PointCoord - 0.5);
      float core = smoothstep(0.18, 0.0, d);
      float halo = smoothstep(0.5, 0.0, d) * 0.35;
      gl_FragColor = vec4(vColor * (core + halo), 1.0);
      #include <fog_fragment>
    }
  `,
})

function CityLights({ count }) {
  const { houses, lights } = useMemo(() => {
    const city = createCity({ count })
    city.lights.setAttribute('lampColor', city.lights.getAttribute('color'))
    city.lights.deleteAttribute('color')
    return city
  }, [count])
  const houseMesh = useRef(null)
  const roofMesh = useRef(null)
  const roofs = useMemo(() => houses.filter((h) => h.roof), [houses])

  const houseGeometry = useMemo(() => {
    const g = new THREE.BoxGeometry(1, 1, 1)
    g.translate(0, 0.5, 0)
    g.setAttribute('aScale', new THREE.InstancedBufferAttribute(new Float32Array(houses.flatMap((h) => [h.w, h.h, h.d])), 3))
    g.setAttribute('aSeed', new THREE.InstancedBufferAttribute(new Float32Array(houses.map((h) => h.seed)), 1))
    return g
  }, [houses])
  const roofGeometry = useMemo(() => {
    const g = new THREE.ConeGeometry(Math.SQRT1_2, 1, 4)
    g.rotateY(Math.PI / 4)
    g.translate(0, 0.5, 0)
    return g
  }, [])

  useEffect(() => {
    const dummy = new THREE.Object3D()
    houses.forEach((h, i) => {
      dummy.position.set(h.x, h.y, h.z)
      dummy.rotation.set(0, h.rot, 0)
      dummy.scale.set(h.w, h.h, h.d)
      dummy.updateMatrix()
      houseMesh.current.setMatrixAt(i, dummy.matrix)
    })
    houseMesh.current.instanceMatrix.needsUpdate = true
    roofs.forEach((h, i) => {
      dummy.position.set(h.x, h.y + h.h, h.z)
      dummy.rotation.set(0, h.rot, 0)
      dummy.scale.set(h.w * 1.08, 0.45 + h.w * 0.18, h.d * 1.08)
      dummy.updateMatrix()
      roofMesh.current.setMatrixAt(i, dummy.matrix)
    })
    roofMesh.current.instanceMatrix.needsUpdate = true
  }, [houses, roofs])

  useFrame(({ size, gl, camera }) => {
    lightsMaterial.uniforms.uScale.value = (size.height * gl.getPixelRatio()) / (2 * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)))
  })

  return (
    <group>
      <instancedMesh ref={houseMesh} args={[houseGeometry, houseMaterial, houses.length]} frustumCulled={false} />
      <instancedMesh ref={roofMesh} args={[roofGeometry, null, roofs.length]} frustumCulled={false}>
        <meshStandardMaterial color="#4a2621" roughness={1} />
      </instancedMesh>
      <points geometry={lights} material={lightsMaterial} frustumCulled={false} />
    </group>
  )
}

/* ---------------- Landmarks ---------------- */

/** A cylinder spanning two points. */
function Beam({ from, to, radius = 0.1, radiusTop, color }) {
  const { position, quaternion, length } = useMemo(() => {
    const dir = new THREE.Vector3().subVectors(to, from)
    return {
      position: new THREE.Vector3().addVectors(from, to).multiplyScalar(0.5),
      quaternion: new THREE.Quaternion().setFromUnitVectors(UP, dir.clone().normalize()),
      length: dir.length(),
    }
  }, [from, to])
  return (
    <mesh position={position} quaternion={quaternion}>
      <cylinderGeometry args={[radiusTop ?? radius, radius, length, 6]} />
      <meshBasicMaterial color={color} toneMapped={false} />
    </mesh>
  )
}

const TOWER_RED = glow('#ff3b36', 1.5)
const TOWER_WHITE = glow('#f4efff', 1.35)

/** Tbilisi TV Broadcasting Tower on Mtatsminda: a three-legged red-and-white lattice mast. */
function TvTower() {
  const H = 19
  const base = terrainHeight(MTATSMINDA.x, MTATSMINDA.z) - 0.3
  const blink = useRef([])

  const { legs, bracing, mast } = useMemo(() => {
    const angles = [0.3, 0.3 + (Math.PI * 2) / 3, 0.3 + (Math.PI * 4) / 3]
    const legAt = (a, t) => {
      const r = THREE.MathUtils.lerp(2.5, 0.5, Math.pow(t, 0.8))
      return new THREE.Vector3(Math.cos(a) * r, t * 0.58 * H, Math.sin(a) * r)
    }
    const legSegments = []
    angles.forEach((a) => {
      for (let k = 0; k < 8; k++) {
        legSegments.push({ from: legAt(a, k / 8), to: legAt(a, (k + 1) / 8), color: k % 2 ? TOWER_WHITE : TOWER_RED, r0: 0.2 - k * 0.014, r1: 0.2 - (k + 1) * 0.014 })
      }
    })
    const lines = []
    for (let k = 0; k < 8; k++) {
      for (let j = 0; j < 3; j++) {
        const a = legAt(angles[j], k / 8)
        const b = legAt(angles[(j + 1) % 3], k / 8)
        const c = legAt(angles[j], (k + 1) / 8)
        const d = legAt(angles[(j + 1) % 3], (k + 1) / 8)
        lines.push(a, b, a, d, b, c)
      }
    }
    const lineGeo = new THREE.BufferGeometry().setFromPoints(lines)
    const mastSegments = []
    for (let k = 0; k < 6; k++) {
      const y0 = 0.58 * H + k * 0.045 * H
      mastSegments.push({ y: y0 + 0.0225 * H, h: 0.045 * H, r0: 0.42 - k * 0.035, r1: 0.42 - (k + 1) * 0.035, color: k % 2 ? TOWER_RED : TOWER_WHITE })
    }
    for (let k = 0; k < 4; k++) {
      const y0 = 0.85 * H + k * 0.0375 * H
      mastSegments.push({ y: y0 + 0.01875 * H, h: 0.0375 * H, r0: 0.09, r1: 0.07, color: k % 2 ? TOWER_WHITE : TOWER_RED })
    }
    return { legs: legSegments, bracing: lineGeo, mast: mastSegments }
  }, [])

  useFrame(({ clock }) => {
    const t = clock.elapsedTime
    blink.current.forEach((m, i) => {
      if (m) m.material.color.copy(TOWER_RED).multiplyScalar(Math.sin(t * 2.2 + i * 1.3) > 0.2 ? 2.6 : 0.35)
    })
  })

  const lamps = [
    [0, H + 0.2, 0],
    [0.95, 0.58 * H + 0.3, 0],
    [-0.5, 0.58 * H + 0.3, 0.8],
    [-0.5, 0.58 * H + 0.3, -0.8],
    [0, 0.74 * H + 0.2, 0.6],
    [1.4, 0.3 * H, 0.8],
  ]

  return (
    <group position={[MTATSMINDA.x, base, MTATSMINDA.z]}>
      {legs.map((s, i) => (
        <Beam key={i} from={s.from} to={s.to} radius={s.r0} radiusTop={s.r1} color={s.color} />
      ))}
      <lineSegments geometry={bracing}>
        <lineBasicMaterial color={glow('#ffd6d0', 1.1)} toneMapped={false} />
      </lineSegments>
      <mesh position={[0, 0.58 * H, 0]}>
        <cylinderGeometry args={[1.05, 0.9, 0.55, 12]} />
        <meshBasicMaterial color={TOWER_WHITE} toneMapped={false} />
      </mesh>
      <mesh position={[0, 0.74 * H, 0]}>
        <cylinderGeometry args={[0.7, 0.6, 0.38, 10]} />
        <meshBasicMaterial color={TOWER_RED} toneMapped={false} />
      </mesh>
      {mast.map((s, i) => (
        <mesh key={i} position={[0, s.y, 0]}>
          <cylinderGeometry args={[s.r1, s.r0, s.h, 6]} />
          <meshBasicMaterial color={s.color} toneMapped={false} />
        </mesh>
      ))}
      {lamps.map((p, i) => (
        <mesh key={i} ref={(m) => (blink.current[i] = m)} position={p}>
          <sphereGeometry args={[i ? 0.16 : 0.24, 8, 6]} />
          <meshBasicMaterial color={TOWER_RED} toneMapped={false} />
        </mesh>
      ))}
      <pointLight position={[0, 0.5 * H, 3]} color="#ffb0a0" intensity={30} distance={28} decay={1.6} />
    </group>
  )
}

const STONE = '#4a3628'
const STONE_GLOW = glow('#d9904f', 0.16)

function Narikala() {
  const crest = useMemo(() => narikalaCrest(), [])
  const walls = useMemo(
    () =>
      crest.slice(0, -1).map((a, i) => {
        const b = crest[i + 1]
        const mid = new THREE.Vector3().addVectors(a, b).multiplyScalar(0.5)
        return { mid, length: a.distanceTo(b) + 0.1, rot: -Math.atan2(b.z - a.z, b.x - a.x), tilt: Math.atan2(b.y - a.y, Math.hypot(b.x - a.x, b.z - a.z)) }
      }),
    [crest],
  )
  const merlons = useRef(null)
  const merlonCount = walls.length * 3
  useEffect(() => {
    const dummy = new THREE.Object3D()
    let i = 0
    walls.forEach((w) => {
      for (let k = 0; k < 3; k++) {
        const t = (k + 0.5) / 3 - 0.5
        dummy.position.set(w.mid.x + Math.cos(-w.rot) * t * w.length, w.mid.y + 0.85 + (walls.indexOf(w) % 3) * 0.15 + Math.sin(w.tilt) * t * w.length, w.mid.z + Math.sin(-w.rot) * t * w.length)
        dummy.rotation.set(0, w.rot, 0)
        dummy.updateMatrix()
        merlons.current.setMatrixAt(i++, dummy.matrix)
      }
    })
    merlons.current.instanceMatrix.needsUpdate = true
  }, [walls])

  const towers = [1, 4, 8, 11, 15, 18].map((i) => ({ p: crest[i], h: 2 + (i % 3) * 0.6, round: i % 2 === 0 }))
  const church = new THREE.Vector3(NARIKALA.x + 4, terrainHeight(NARIKALA.x + 4, NARIKALA.z + 3.5), NARIKALA.z + 3.5)

  return (
    <group>
      {walls.map((w, i) => (
        <mesh key={i} position={[w.mid.x, w.mid.y + 0.2 + (i % 3) * 0.08, w.mid.z]} rotation={[0, w.rot, w.tilt]} visible={i % 7 !== 3}>
          <boxGeometry args={[w.length, 0.9 + (i % 3) * 0.15, 0.45]} />
          <meshStandardMaterial color={STONE} emissive={STONE_GLOW} roughness={1} />
        </mesh>
      ))}
      <instancedMesh ref={merlons} args={[null, null, merlonCount]}>
        <boxGeometry args={[0.3, 0.3, 0.45]} />
        <meshStandardMaterial color={STONE} emissive={STONE_GLOW} roughness={1} />
      </instancedMesh>
      {towers.map(({ p, h, round }, i) => (
        <group key={i} position={[p.x, p.y, p.z]}>
          <mesh position={[0, h / 2, 0]}>
            {round ? <cylinderGeometry args={[0.6, 0.75, h, 10]} /> : <boxGeometry args={[1.2, h, 1.2]} />}
            <meshStandardMaterial color={STONE} emissive={STONE_GLOW} emissiveIntensity={1.6} roughness={1} />
          </mesh>
          <mesh position={[0, h * 0.62, 0.62]}>
            <planeGeometry args={[0.18, 0.32]} />
            <meshBasicMaterial color={glow('#ffc37a', 1.6)} toneMapped={false} />
          </mesh>
        </group>
      ))}
      <group position={church}>
        <mesh position={[0, 0.7, 0]}>
          <boxGeometry args={[1.4, 1.4, 1]} />
          <meshStandardMaterial color="#7a6048" emissive={glow('#ffcf96', 0.3)} roughness={1} />
        </mesh>
        <mesh position={[0, 1.75, 0]}>
          <coneGeometry args={[0.45, 0.8, 8]} />
          <meshStandardMaterial color="#5a3a2a" emissive={glow('#ffcf96', 0.3)} roughness={1} />
        </mesh>
      </group>
      <pointLight position={[NARIKALA.x, terrainHeight(NARIKALA.x, NARIKALA.z) + 1, NARIKALA.z + 6]} color="#ffb070" intensity={14} distance={18} decay={1.6} />
    </group>
  )
}

function KartlisDeda() {
  const { x, z } = KARTLIS_DEDA
  const y = terrainHeight(x, z) - 0.2
  const silver = glow('#e4e9ff', 1.1)
  return (
    <group position={[x, y, z]} rotation={[0, 0.5, 0]}>
      <mesh position={[0, 0.6, 0]}>
        <boxGeometry args={[1, 1.2, 1]} />
        <meshStandardMaterial color="#555b6e" emissive={glow('#b8c2ff', 0.25)} />
      </mesh>
      <mesh position={[0, 2.5, 0]}>
        <cylinderGeometry args={[0.22, 0.42, 2.6, 10]} />
        <meshBasicMaterial color={silver} toneMapped={false} />
      </mesh>
      <mesh position={[0, 4.0, 0]}>
        <sphereGeometry args={[0.24, 12, 10]} />
        <meshBasicMaterial color={silver} toneMapped={false} />
      </mesh>
      <mesh position={[0.55, 3.3, 0.1]} rotation={[0, 0, 0.2]}>
        <boxGeometry args={[0.85, 0.09, 0.09]} />
        <meshBasicMaterial color={silver} toneMapped={false} />
      </mesh>
      <mesh position={[-0.45, 3.65, 0]} rotation={[0, 0, -0.5]}>
        <boxGeometry args={[0.08, 1.3, 0.08]} />
        <meshBasicMaterial color={silver} toneMapped={false} />
      </mesh>
    </group>
  )
}

/* ---------------- Foreground neighbours ---------------- */

const WOOD = '#6a3f25'
const WOOD_LIGHT = '#8a5a36'

/** An old-town house front with carved wooden balconies, close to Nina's balcony. */
function NeighbourHouse({ position, width, floors, rotation = 0, seed = 1 }) {
  const floorH = 2.6
  const height = floors * floorH
  const windows = useMemo(() => {
    const list = []
    let s = seed
    const r = () => (s = (s * 16807) % 2147483647) / 2147483647
    for (let f = 0; f < floors; f++) {
      const cols = Math.max(2, Math.floor(width / 1.6))
      for (let c = 0; c < cols; c++) {
        list.push({ x: -width / 2 + (c + 0.5) * (width / cols), y: f * floorH + 1.35, lit: r() > 0.35, warm: r() })
      }
    }
    return list
  }, [width, floors, seed])
  const balconyFloors = [floors - 1, floors - 2].filter((f) => f >= 0)

  return (
    <group position={position} rotation={[0, rotation, 0]}>
      <mesh position={[0, height / 2, 0]}>
        <boxGeometry args={[width, height, 5]} />
        <meshStandardMaterial color="#3b2f3a" roughness={1} />
      </mesh>
      <mesh position={[0, height + 0.6, 0]} rotation={[0, Math.PI / 4, 0]} scale={[width * 0.75, 1, 3.6]}>
        <coneGeometry args={[1, 1.4, 4]} />
        <meshStandardMaterial color="#4a2621" roughness={1} />
      </mesh>
      {windows.map((w, i) => (
        <mesh key={i} position={[w.x, w.y, 2.51]}>
          <planeGeometry args={[0.7, 1.15]} />
          <meshBasicMaterial color={w.lit ? glow(w.warm > 0.5 ? '#ffb85c' : '#ffd79a', 1.5) : '#120e1a'} toneMapped={false} />
        </mesh>
      ))}
      {balconyFloors.map((f) => (
        <CarvedBalcony key={f} y={f * floorH + 0.25} width={width - 0.6} />
      ))}
    </group>
  )
}

function CarvedBalcony({ y, width }) {
  const depth = 1.1
  const balusters = Math.floor(width / 0.28)
  const panels = Math.floor(width / 0.9)
  return (
    <group position={[0, y, 2.5 + depth / 2]}>
      <mesh>
        <boxGeometry args={[width, 0.12, depth]} />
        <meshStandardMaterial color={WOOD} roughness={0.8} />
      </mesh>
      <mesh position={[0, 0.95, depth / 2]}>
        <boxGeometry args={[width, 0.08, 0.1]} />
        <meshStandardMaterial color={WOOD_LIGHT} roughness={0.7} />
      </mesh>
      <mesh position={[0, 0.42, depth / 2]}>
        <boxGeometry args={[width, 0.06, 0.08]} />
        <meshStandardMaterial color={WOOD_LIGHT} roughness={0.7} />
      </mesh>
      {Array.from({ length: balusters }, (_, i) => (
        <mesh key={i} position={[-width / 2 + (i + 0.5) * (width / balusters), 0.68, depth / 2]}>
          <boxGeometry args={[0.05, 0.5, 0.05]} />
          <meshStandardMaterial color={WOOD} roughness={0.8} />
        </mesh>
      ))}
      {Array.from({ length: panels }, (_, i) => {
        const cx = -width / 2 + (i + 0.5) * (width / panels)
        return (
          <group key={i} position={[cx, 0.22, depth / 2 + 0.01]}>
            <mesh rotation={[0, 0, Math.PI / 4]}>
              <torusGeometry args={[0.14, 0.025, 4, 4]} />
              <meshStandardMaterial color={WOOD_LIGHT} roughness={0.7} />
            </mesh>
            <mesh rotation={[0, 0, 0.7]}>
              <boxGeometry args={[0.04, 0.42, 0.03]} />
              <meshStandardMaterial color={WOOD} roughness={0.8} />
            </mesh>
            <mesh rotation={[0, 0, -0.7]}>
              <boxGeometry args={[0.04, 0.42, 0.03]} />
              <meshStandardMaterial color={WOOD} roughness={0.8} />
            </mesh>
          </group>
        )
      })}
      {[-1, 1].map((s) => (
        <mesh key={s} position={[s * (width / 2 - 0.05), 1.25, depth / 2]}>
          <boxGeometry args={[0.1, 2.5, 0.1]} />
          <meshStandardMaterial color={WOOD} roughness={0.8} />
        </mesh>
      ))}
      <mesh position={[0, 2.48, depth / 2 - 0.05]}>
        <boxGeometry args={[width + 0.2, 0.1, depth + 0.2]} />
        <meshStandardMaterial color={WOOD} roughness={0.8} />
      </mesh>
      <pointLight position={[0, 1.2, depth]} color="#ffb070" intensity={2.5} distance={4} decay={1.8} />
    </group>
  )
}

function Moon() {
  return (
    <mesh position={[-60, 70, -200]}>
      <sphereGeometry args={[6, 32, 16]} />
      <meshBasicMaterial color={glow('#fff4d6', 1.8)} toneMapped={false} fog={false} />
    </mesh>
  )
}

export default function Tbilisi({ mobile = false }) {
  return (
    <group>
      <CityClock />
      <Sky />
      <Stars radius={200} depth={50} count={mobile ? 1400 : 2600} factor={5} saturation={0.2} fade speed={0.6} />
      <Moon />
      <Clouds />
      <Birds />
      <Terrain />
      <River />
      <CityLights count={mobile ? 1800 : 2600} />
      <Haze />
      <Narikala />
      <KartlisDeda />
      <TvTower />
      <NeighbourHouse position={[-2.6, 2.8 - 5 * 2.6, -20]} width={4.4} floors={5} rotation={0.45} seed={3} />
      <NeighbourHouse position={[2.2, 2.2 - 5 * 2.6, -17]} width={4} floors={5} rotation={0.6} seed={9} />
    </group>
  )
}
