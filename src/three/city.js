import * as THREE from 'three'

export function seeded(seed) {
  let s = seed
  return () => (s = (s * 16807) % 2147483647) / 2147483647
}

const bump = (dx, dz, rx, rz) => Math.exp(-((dx * dx) / (rx * rx) + (dz * dz) / (rz * rz)))

export const RIVER_Z = -30
export const MTATSMINDA = { x: -60, z: -128 }
export const NARIKALA = { x: -28, z: -50 }
export const KARTLIS_DEDA = { x: -47, z: -61 }

/** Ground height of the city: Narikala and Sololaki ridges, Mtatsminda behind, the Kura in the valley. */
export function terrainHeight(x, z) {
  return (
    -11 +
    9 * bump(x - NARIKALA.x, z - NARIKALA.z, 20, 8) +
    6.5 * bump(x - KARTLIS_DEDA.x, z - KARTLIS_DEDA.z, 13, 9) +
    11 * bump(x - MTATSMINDA.x, z - MTATSMINDA.z, 38, 20) +
    9 * bump(x + 20, z + 152, 130, 24) +
    5 * bump(x + 45, z + 98, 45, 24) +
    3 * bump(x - 8, z + 62, 20, 12) -
    2.6 * Math.exp(-((z - RIVER_Z) ** 2) / 22) +
    0.5 * Math.sin(x * 0.21) * Math.cos(z * 0.17)
  )
}

export function createTerrainGeometry() {
  const geo = new THREE.PlaneGeometry(320, 200, 200, 120)
  geo.rotateX(-Math.PI / 2)
  geo.translate(0, 0, -105)
  const pos = geo.attributes.position
  for (let i = 0; i < pos.count; i++) {
    pos.setY(i, terrainHeight(pos.getX(i), pos.getZ(i)))
  }
  geo.computeVertexNormals()
  return geo
}

const LAMP_COLORS = [
  [2.6, 1.55, 0.55],
  [2.6, 1.55, 0.55],
  [2.4, 1.8, 1.1],
  [2.2, 1.2, 0.45],
  [1.7, 1.7, 1.9],
]

/** Slope steepness, used to keep houses off cliffs and the fortress crest. */
function slope(x, z) {
  const e = 0.6
  return Math.hypot(terrainHeight(x + e, z) - terrainHeight(x - e, z), terrainHeight(x, z + e) - terrainHeight(x, z - e)) / (2 * e)
}

/**
 * Houses packed over the hills (with old-town roofs near Narikala), street lamps along winding
 * lanes, and a scatter of far lights. Everything is plain data for instanced meshes / points.
 */
export function createCity({ count = 2600 } = {}) {
  const rnd = seeded(7)
  const houses = []
  let attempts = 0
  while (houses.length < count && attempts < count * 12) {
    attempts++
    const x = -125 + rnd() * 160
    const z = -12 - rnd() * 130
    if (Math.abs(z - RIVER_Z) < 4.5) continue
    if (Math.hypot(x - MTATSMINDA.x, (z - MTATSMINDA.z) * 1.6) < 13) continue
    if (bump(x - NARIKALA.x, z - NARIKALA.z, 20, 8) > 0.55) continue
    if (bump(x - KARTLIS_DEDA.x, z - KARTLIS_DEDA.z, 13, 9) > 0.7) continue
    if (slope(x, z) > 1.1) continue
    const oldTown = x > -60 && x < 5 && z > -75
    const density = oldTown ? 1 : 0.35 + 0.5 * Math.exp(-Math.abs(x + 40) / 60)
    if (rnd() > density) continue
    const far = z < -95
    const w = (far ? 1.6 : 1.1) + rnd() * 1.6
    const d = 1.1 + rnd() * 1.3
    const h = oldTown ? 1.2 + rnd() * 1.8 : 1.4 + rnd() * (far ? 2.2 : 3.4)
    const y = terrainHeight(x, z) - 0.35
    houses.push({ x, y, z, w, h, d, rot: (rnd() - 0.5) * 0.9, seed: rnd(), roof: oldTown || rnd() < 0.25 })
  }

  const positions = []
  const colors = []
  const phases = []
  const sizes = []
  const addLight = (x, y, z, color, size) => {
    positions.push(x, y, z)
    colors.push(...color)
    phases.push(rnd() * Math.PI * 2)
    sizes.push(size)
  }

  // Street lamps along lanes that wind up the slopes.
  for (let s = 0; s < 34; s++) {
    let x = -115 + rnd() * 140
    let z = -14 - rnd() * 110
    let heading = rnd() * Math.PI * 2
    const steps = 12 + Math.floor(rnd() * 22)
    for (let i = 0; i < steps; i++) {
      heading += (rnd() - 0.5) * 0.7
      x += Math.cos(heading) * 1.9
      z += Math.sin(heading) * 1.9
      if (z > -12 || Math.abs(z - RIVER_Z) < 3.5) break
      const c = LAMP_COLORS[Math.floor(rnd() * 2)]
      addLight(x, terrainHeight(x, z) + 0.55, z, c, 1.25 + rnd() * 0.5)
    }
  }
  // Embankment lights along the Kura.
  for (let x = -120; x < 40; x += 2.2) {
    for (const side of [-1, 1]) addLight(x, terrainHeight(x, RIVER_Z + side * 4) + 0.6, RIVER_Z + side * 4, LAMP_COLORS[2], 1.3)
  }
  // A haze of tiny far lights to suggest the city continuing beyond the hills.
  for (let i = 0; i < 2200; i++) {
    const x = -160 + rnd() * 220
    const z = -95 - rnd() * 70
    if (Math.hypot(x - MTATSMINDA.x, (z - MTATSMINDA.z) * 1.6) < 12) continue
    const k = 0.4 + rnd() * 0.6
    const c = LAMP_COLORS[Math.floor(rnd() * LAMP_COLORS.length)]
    addLight(x, terrainHeight(x, z) + 0.4, z, [c[0] * k, c[1] * k, c[2] * k], 0.7 + rnd() * 0.4)
  }

  const lights = new THREE.BufferGeometry()
  lights.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3))
  lights.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3))
  lights.setAttribute('phase', new THREE.Float32BufferAttribute(phases, 1))
  lights.setAttribute('size', new THREE.Float32BufferAttribute(sizes, 1))
  return { houses, lights }
}

/** Walk along the Narikala crest: points on the ridge where the fortress wall runs. */
export function narikalaCrest() {
  const pts = []
  for (let i = 0; i <= 18; i++) {
    const x = NARIKALA.x - 15 + i * 1.75
    const z = NARIKALA.z + Math.sin(i * 0.45) * 1.6 - 0.8
    pts.push(new THREE.Vector3(x, terrainHeight(x, z), z))
  }
  return pts
}

/** Texture drawn on the laptop screen; it matches the Nina OS wallpaper so the dive lands seamlessly. */
export function drawScreenTexture(canvas) {
  const ctx = canvas.getContext('2d')
  const { width: w, height: h } = canvas

  const sky = ctx.createLinearGradient(0, 0, 0, h)
  sky.addColorStop(0, '#0b1030')
  sky.addColorStop(0.45, '#1d1844')
  sky.addColorStop(0.75, '#3b2363')
  sky.addColorStop(1, '#6b3360')
  ctx.fillStyle = sky
  ctx.fillRect(0, 0, w, h)

  const glow = ctx.createRadialGradient(w / 2, h * 1.05, 0, w / 2, h * 1.05, w * 0.55)
  glow.addColorStop(0, 'rgba(240,116,90,0.55)')
  glow.addColorStop(1, 'rgba(240,116,90,0)')
  ctx.fillStyle = glow
  ctx.fillRect(0, 0, w, h)

  ctx.fillStyle = 'rgba(15,20,48,0.75)'
  ctx.fillRect(0, 0, w, 34)
  ctx.fillStyle = '#ffb347'
  ctx.font = '700 18px "Noto Sans Georgian", sans-serif'
  ctx.fillText('ნ', 16, 24)
  ctx.fillStyle = '#e8e6f4'
  ctx.font = '600 15px "Space Grotesk", sans-serif'
  ctx.fillText('Nina OS', 40, 23)

  ctx.textAlign = 'center'
  ctx.fillStyle = 'rgba(232,230,244,0.9)'
  ctx.font = '700 46px "Unbounded", sans-serif'
  ctx.fillText('Nina OS', w / 2, h * 0.44)
  ctx.font = '400 18px "JetBrains Mono", monospace'
  ctx.fillStyle = 'rgba(255,179,71,0.9)'
  ctx.fillText('logging in…', w / 2, h * 0.44 + 40)
  ctx.textAlign = 'left'

  const dockW = 360
  const dockX = (w - dockW) / 2
  ctx.fillStyle = 'rgba(15,20,48,0.7)'
  ctx.beginPath()
  ctx.roundRect(dockX, h - 70, dockW, 54, 18)
  ctx.fill()
  const iconColors = ['#ffb347', '#4fd1c5', '#f0745a', '#a78bfa', '#e8e6f4', '#0a66c2']
  iconColors.forEach((c, i) => {
    ctx.fillStyle = c
    ctx.beginPath()
    ctx.roundRect(dockX + 18 + i * 56, h - 61, 38, 38, 10)
    ctx.fill()
  })
}

/** Laptop keyboard: dark keys with faint legends and a soft warm backlight. */
export function drawKeyboardTexture(canvas) {
  const ctx = canvas.getContext('2d')
  const { width: w, height: h } = canvas
  ctx.fillStyle = '#9fa3ad'
  ctx.fillRect(0, 0, w, h)
  const rows = [14, 14, 13, 12, 9]
  const pad = w * 0.02
  const rowH = (h - pad * 2) / rows.length
  const legends = '`1234567890-=QWERTYUIOP[]ASDFGHJKL;\'ZXCVBNM,./'
  let li = 0
  rows.forEach((n, r) => {
    const y = pad + r * rowH
    const unit = (w - pad * 2) / 14.6
    let x = pad + (r === 2 ? unit * 0.6 : r === 3 ? unit * 1.1 : 0)
    for (let k = 0; k < n; k++) {
      let kw = unit * 0.9
      if (r === 4 && k === 4) kw = unit * 4.6
      ctx.fillStyle = '#23252e'
      ctx.beginPath()
      ctx.roundRect(x, y + rowH * 0.06, kw, rowH * 0.86, unit * 0.12)
      ctx.fill()
      ctx.fillStyle = 'rgba(255, 200, 150, 0.08)'
      ctx.fillRect(x + kw * 0.1, y + rowH * 0.12, kw * 0.8, rowH * 0.25)
      if (r < 4 && li < legends.length) {
        ctx.fillStyle = 'rgba(255, 214, 170, 0.55)'
        ctx.font = `600 ${Math.round(rowH * 0.32)}px "JetBrains Mono", monospace`
        ctx.fillText(legends[li++], x + kw * 0.3, y + rowH * 0.55)
      }
      x += kw + unit * 0.1
    }
  })
}
