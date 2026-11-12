import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { VRMLoaderPlugin, VRMUtils } from '@pixiv/three-vrm'
import { setProgress } from './progress'
import { stylize } from './stylize'

// Drop your own VRoid export at public/models/nina.vrm and it replaces the placeholder automatically.
const OWN_MODEL = '/models/nina.vrm'
const PLACEHOLDER_MODEL = '/models/placeholder.vrm'
const TARGET_HEIGHT = 1.6

let bufferPromise = null

async function resolveModelUrl() {
  try {
    const res = await fetch(OWN_MODEL, { method: 'HEAD' })
    const type = res.headers.get('content-type') ?? ''
    if (res.ok && !type.includes('text/html')) return OWN_MODEL
  } catch {
    // Fall through to the placeholder.
  }
  return PLACEHOLDER_MODEL
}

async function downloadModel() {
  const res = await fetch(await resolveModelUrl())
  const total = Number(res.headers.get('content-length')) || 0
  if (!res.body || !total) {
    const buffer = await res.arrayBuffer()
    setProgress(1)
    return buffer
  }
  const reader = res.body.getReader()
  const bytes = new Uint8Array(total)
  let received = 0
  for (;;) {
    const { done, value } = await reader.read()
    if (done) break
    bytes.set(value, received)
    received += value.length
    setProgress(received / total)
  }
  setProgress(1)
  return bytes.buffer
}

/** Downloads the model once and parses a fresh VRM instance on every call. */
export async function loadVRM() {
  bufferPromise ??= downloadModel()
  const buffer = await bufferPromise

  const loader = new GLTFLoader()
  loader.register((parser) => new VRMLoaderPlugin(parser))
  const gltf = await loader.parseAsync(buffer, '')
  const vrm = gltf.userData.vrm

  VRMUtils.removeUnnecessaryVertices(gltf.scene)
  VRMUtils.combineSkeletons(gltf.scene)
  VRMUtils.rotateVRM0(vrm)
  stylize(vrm)
  vrm.scene.traverse((obj) => {
    obj.frustumCulled = false
    if (obj.isMesh) obj.castShadow = true
  })

  const head = vrm.humanoid.getNormalizedBoneNode('head')
  vrm.scene.updateMatrixWorld(true)
  const headHeight = head.getWorldPosition(head.position.clone()).y
  vrm.scene.scale.setScalar(TARGET_HEIGHT / (headHeight * 1.08))
  return vrm
}
