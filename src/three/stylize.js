import * as THREE from 'three'

const INNER = [0.62, 0.66, 0.18]
const MID = [0.22, 0.68, 0.3]
const OUTER = [0.08, 0.4, 0.22]

function green(r) {
  const mix = (a, b, t) => a.map((v, i) => v + (b[i] - v) * t)
  if (r < 0.3) return INNER
  if (r < 0.6) return mix(INNER, MID, (r - 0.3) / 0.3)
  return mix(MID, OUTER, Math.min(1, (r - 0.6) / 0.4))
}

/** Bounding ellipse of the bright (iris) pixels in one half of the texture. */
function findIris(data, width, height, x0, x1) {
  let minX = x1
  let maxX = x0
  let minY = height
  let maxY = 0
  for (let y = 0; y < height; y++) {
    for (let x = x0; x < x1; x++) {
      const i = (y * width + x) * 4
      if (data[i] + data[i + 1] + data[i + 2] > 60) {
        minX = Math.min(minX, x)
        maxX = Math.max(maxX, x)
        minY = Math.min(minY, y)
        maxY = Math.max(maxY, y)
      }
    }
  }
  return { cx: (minX + maxX) / 2, cy: (minY + maxY) / 2, rx: Math.max(1, (maxX - minX) / 2), ry: Math.max(1, (maxY - minY) / 2) }
}

/** Repaints the iris texture green: a thin gold ring around the pupil, deep green toward the rim. */
function recolorIris(material) {
  const texture = material.uniforms?.map?.value
  const img = texture?.image
  if (!img?.width) return
  const canvas = document.createElement('canvas')
  canvas.width = img.width
  canvas.height = img.height
  const ctx = canvas.getContext('2d', { willReadFrequently: true })
  ctx.drawImage(img, 0, 0)
  const pixels = ctx.getImageData(0, 0, canvas.width, canvas.height)
  const { data, width, height } = pixels
  const halves = [findIris(data, width, height, 0, width >> 1), findIris(data, width, height, width >> 1, width)]

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = (y * width + x) * 4
      const eye = halves[x < width >> 1 ? 0 : 1]
      const r = Math.hypot((x - eye.cx) / eye.rx, (y - eye.cy) / eye.ry)
      const lum = (0.3 * data[i] + 0.59 * data[i + 1] + 0.11 * data[i + 2]) / 255
      const highlight = Math.max(0, lum - 0.62) * 1.6
      const tint = green(r)
      const shade = 1.3 * Math.pow(Math.min(1, lum / 0.45), 0.8)
      for (let c = 0; c < 3; c++) {
        const v = tint[c] * shade + highlight
        data[i + c] = Math.min(255, v * 255)
      }
    }
  }
  ctx.putImageData(pixels, 0, 0)

  const recolored = new THREE.CanvasTexture(canvas)
  recolored.colorSpace = texture.colorSpace
  recolored.flipY = texture.flipY
  recolored.wrapS = texture.wrapS
  recolored.wrapT = texture.wrapT
  recolored.channel = texture.channel
  material.uniforms.map.value = recolored
  if (material.uniforms.shadeMultiplyTexture?.value === texture) material.uniforms.shadeMultiplyTexture.value = recolored
  texture.dispose()
}

/** Personal touch on the placeholder: green eyes. */
export function stylize(vrm) {
  vrm.scene.traverse((obj) => {
    if (!obj.isMesh) return
    const materials = Array.isArray(obj.material) ? obj.material : [obj.material]
    materials.forEach((m) => /EyeIris/i.test(m.name) && recolorIris(m))
  })
}
