import { useEffect, useRef, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import { VRMUtils } from '@pixiv/three-vrm'
import * as THREE from 'three'
import { loadVRM } from './vrm'
import { measureArm, solveArm } from './armIK'
import { blinkCurve, noise, rand, Spring, Spring3, tapCurve, WAVE_DURATION, waveRaise, waveSwing } from './motion'

const H = Math.PI / 2

// Normalized humanoid bone rotations (Euler XYZ), for a model facing +Z.
const SIT_LEGS = {
  leftUpperLeg: [-H, 0.02, 0.07],
  rightUpperLeg: [-H + 0.03, -0.05, -0.05],
  leftLowerLeg: [H - 0.04, 0, 0],
  rightLowerLeg: [H + 0.04, 0, 0],
  leftFoot: [-0.12, 0, 0],
  rightFoot: [-0.06, 0.04, 0],
}

const POSES = {
  sit: {
    ...SIT_LEGS,
    hips: [0, 0, 0],
    spine: [0.1, 0, 0],
    chest: [0.06, 0, 0],
    upperChest: [0.02, 0, 0],
    neck: [0.06, 0, 0],
    head: [0, 0, 0],
    leftShoulder: [0, 0, 0.04],
    rightShoulder: [0, 0, -0.04],
    leftUpperArm: [-0.9, 0.45, -1.3],
    rightUpperArm: [-0.9, -0.45, 1.3],
    leftLowerArm: [0, -1.65, 0],
    rightLowerArm: [0, 1.65, 0],
    leftHand: [1.2, 0, 0],
    rightHand: [-1.2, 0, 0],
  },
  stand: {
    hips: [0, 0, 0],
    spine: [0.02, 0, 0],
    chest: [0, 0, 0],
    upperChest: [0, 0, 0],
    neck: [0, 0, 0],
    head: [0, 0, 0],
    leftShoulder: [0, 0, 0],
    rightShoulder: [0, 0, 0],
    leftUpperArm: [0.08, 0.05, -1.22],
    rightUpperArm: [0.04, -0.03, 1.27],
    leftLowerArm: [0, -0.32, 0],
    rightLowerArm: [0, 0.2, 0],
    leftHand: [0.1, 0, 0.12],
    rightHand: [0.05, 0, -0.08],
    leftUpperLeg: [0, 0, 0],
    rightUpperLeg: [0, 0, 0],
    leftLowerLeg: [0, 0, 0],
    rightLowerLeg: [0, 0, 0],
  },
}

// Right arm raised for a wave (shared by both modes).
const WAVE_ARM = {
  rightShoulder: [0, 0, -0.12],
  rightUpperArm: [-0.2, -0.05, -0.95],
  rightLowerArm: [0, 0.1, -0.75],
  rightHand: [0, 0, 0.05],
}

const FINGERS = ['Index', 'Middle', 'Ring', 'Little']
const SEGMENTS = ['Proximal', 'Intermediate', 'Distal']
const TYPING_CURL = [0.32, 0.38, 0.44, 0.5]
const RELAXED_CURL = [0.2, 0.28, 0.36, 0.42]
const FINGER_WEIGHTS = [0.4, 0.3, 0.2, 0.1]

const BODY_BONES = [...new Set(Object.values(POSES).flatMap((p) => Object.keys(p)))]
const FINGER_BONES = ['left', 'right'].flatMap((s) => FINGERS.flatMap((f) => SEGMENTS.map((g) => `${s}${f}${g}`)))
const SMOOTH_RATE = (name) => (FINGER_BONES.includes(name) ? 28 : /Arm|Hand|Shoulder/.test(name) ? 16 : 9)

const v1 = new THREE.Vector3()
const v2 = new THREE.Vector3()
const qInv = new THREE.Quaternion()
const qTmp = new THREE.Quaternion()
const eTmp = new THREE.Euler()
const ikTarget = new THREE.Vector3()
const ikPole = new THREE.Vector3()
const ikPalm = new THREE.Vector3()
const ikRootQ = new THREE.Quaternion()

function setBone(vrm, name, x, y, z, flip) {
  const node = vrm.humanoid.getNormalizedBoneNode(name)
  if (node) node.rotation.set(x * flip, y, z * flip)
  return node
}

function addBone(vrm, name, x, y, z, flip) {
  const node = vrm.humanoid.getNormalizedBoneNode(name)
  if (!node) return
  node.rotation.x += x * flip
  node.rotation.y += y
  node.rotation.z += z * flip
}

function applyPose(vrm, pose, flip) {
  for (const [name, [x, y, z]] of Object.entries(pose)) setBone(vrm, name, x, y, z, flip)
}

function placeOnFloor(vrm, rootGroup, sit) {
  const flip = vrm.meta?.metaVersion === '0' ? -1 : 1
  applyPose(vrm, sit ? POSES.sit : POSES.stand, flip)
  vrm.update(0)
  vrm.scene.position.set(0, 0, 0)
  vrm.scene.updateMatrixWorld(true)

  const local = (bone) => {
    const node = vrm.humanoid.getNormalizedBoneNode(bone)
    return rootGroup.worldToLocal(node.getWorldPosition(new THREE.Vector3()))
  }
  if (sit) {
    const footY = Math.min(local('leftFoot').y, local('rightFoot').y)
    vrm.scene.position.y = -(footY - 0.07)
  } else {
    const toes = vrm.humanoid.getNormalizedBoneNode('leftToes') ? local('leftToes').y : local('leftFoot').y - 0.06
    vrm.scene.position.y = -(toes - 0.02)
  }
  vrm.scene.updateMatrixWorld(true)
  const hips = local('hips')
  const side = Math.sign(local('leftUpperArm').x - hips.x) || 1
  const handAt = (s) => new THREE.Vector3(hips.x + s * 0.1, hips.y + 0.21, hips.z + 0.36)
  return {
    hips,
    head: local('head'),
    side,
    leftHand: sit ? handAt(side) : local('leftHand'),
    rightHand: sit ? handAt(-side) : local('rightHand'),
  }
}

function createHand() {
  return {
    offset: new Spring3(),
    goal: new THREE.Vector3(),
    wanderIn: 0,
    nextTap: rand(0.1, 0.4),
    taps: [-9, -9, -9, -9],
    press: 0,
  }
}

function createMotion(anchors, vrm) {
  const now = performance.now() / 1000
  const head = new THREE.Vector3()
  vrm.humanoid.getNormalizedBoneNode('head')?.getWorldPosition(head)
  return {
    anchors,
    arms: { left: measureArm(vrm.humanoid, 'left'), right: measureArm(vrm.humanoid, 'right') },
    prev: new Map(),
    breath: Math.random() * 6,
    gaze: new Spring3(head.add(v1.set(0, -0.2, 0.6))),
    gazeMode: 'keys',
    gazeUntil: now + rand(1.5, 3),
    saccade: new THREE.Vector3(),
    saccadeAt: now + rand(0.4, 1.4),
    nextBlink: now + rand(1.5, 3.5),
    blinkStart: -9,
    blinkLength: 0.16,
    doubleBlink: false,
    typing: { state: 'burst', until: now + rand(1.5, 4), pauseKind: 'rest' },
    hands: { left: createHand(), right: createHand() },
    lastWave: -99,
    focusUntil: 0,
    wavePhase: 0,
    smile: new Spring(0.2),
    attention: new Spring(0),
    faces: findFaceMorphs(vrm),
  }
}

/** Face meshes that carry the closed-mouth smile morphs. */
function findFaceMorphs(vrm) {
  const faces = []
  vrm.scene.traverse((o) => {
    const dict = o.morphTargetDictionary
    if (o.isMesh && dict && dict.Fcl_MTH_Fun !== undefined) {
      faces.push({ mesh: o, smile: dict.Fcl_MTH_Fun, close: dict.Fcl_MTH_Close, eyes: dict.Fcl_EYE_Joy })
    }
  })
  return faces
}

/** Lips stay closed; the smile only lifts the mouth corners and softens the eyes a touch. */
function applyFace(faces, smile, blink) {
  for (const f of faces) {
    const inf = f.mesh.morphTargetInfluences
    inf[f.smile] = smile
    if (f.close !== undefined) inf[f.close] = 0.15
    if (f.eyes !== undefined) inf[f.eyes] = smile * 0.25 * (1 - blink)
  }
}

function scheduleTyping(m, now, attention) {
  const typing = m.typing
  if (now < typing.until) return
  if (typing.state === 'burst') {
    typing.state = 'pause'
    const r = Math.random()
    typing.pauseKind = r < 0.25 ? 'trackpad' : 'rest'
    typing.until = now + (typing.pauseKind === 'trackpad' ? rand(1.2, 2.4) : rand(0.35, 1.5))
    if (Math.random() < 0.55) {
      m.gazeMode = now > m.focusUntil && attention > 0.3 && Math.random() < 0.3 * attention ? 'viewer' : 'screen'
      m.gazeUntil = now + (m.gazeMode === 'viewer' ? rand(0.8, 1.4) : rand(0.8, 1.8))
    }
  } else {
    typing.state = 'burst'
    typing.until = now + rand(1.2, 4.5)
  }
}

function scheduleGaze(m, now, attention, sit) {
  if (now < m.gazeUntil) return
  const r = Math.random()
  if (!sit) {
    m.gazeMode = r < 0.8 ? 'viewer' : 'away'
    m.gazeUntil = now + (m.gazeMode === 'viewer' ? rand(2.5, 6) : rand(0.6, 1.4))
    return
  }
  if (r < 0.35) {
    m.gazeMode = 'screen'
    m.gazeUntil = now + rand(0.7, 1.8)
  } else {
    m.gazeMode = 'keys'
    m.gazeUntil = now + rand(2, 5)
  }
}

/** Hands on the keyboard via IK, with wandering wrists and per-finger taps. */
function typeWithIK(vrm, rootGroup, m, now, dt, raise, flip) {
  const { anchors, typing } = m
  rootGroup.updateMatrixWorld(true)
  rootGroup.getWorldQuaternion(ikRootQ)
  ikPalm.set(0, -1, 0)
  const bursting = typing.state === 'burst'

  for (const [prefix, s] of [['left', anchors.side], ['right', -anchors.side]]) {
    const arm = m.arms[prefix]
    if (!arm) continue
    const hand = m.hands[prefix]

    hand.wanderIn -= dt
    if (hand.wanderIn <= 0) {
      hand.wanderIn = rand(0.35, 1.3)
      if (bursting) hand.goal.set(rand(-0.025, 0.025), 0, rand(-0.015, 0.02))
      else if (typing.pauseKind === 'trackpad' && prefix === 'right') hand.goal.set(s * -0.075, -0.004, -0.035)
      else hand.goal.set(s * rand(0, 0.015), 0.012, rand(-0.03, -0.012))
    }

    if (bursting && now >= hand.nextTap) {
      const r = Math.random()
      let finger = 0
      for (let acc = FINGER_WEIGHTS[0]; r > acc && finger < 3; acc += FINGER_WEIGHTS[++finger]);
      hand.taps[finger] = now
      hand.nextTap = now + (Math.random() < 0.12 ? rand(0.35, 0.7) : rand(0.07, 0.3))
    }

    let press = 0
    hand.taps.forEach((start, i) => {
      const tap = tapCurve((now - start) / 0.17)
      press = Math.max(press, tap)
      const base = (bursting || typing.pauseKind === 'trackpad' ? TYPING_CURL[i] : RELAXED_CURL[i] + 0.05) + tap * 0.5
      const sign = prefix === 'left' ? -1 : 1
      setBone(vrm, `${prefix}${FINGERS[i]}Proximal`, 0, 0, sign * (base * 0.8), flip)
      setBone(vrm, `${prefix}${FINGERS[i]}Intermediate`, 0, 0, sign * (base * 1.0 - tap * 0.1), flip)
      setBone(vrm, `${prefix}${FINGERS[i]}Distal`, 0, 0, sign * (base * 0.6), flip)
    })
    hand.press = press

    const offset = hand.offset.step(hand.goal, 7, dt)
    ikTarget.copy(anchors[`${prefix}Hand`]).add(offset)
    ikTarget.y -= press * 0.004
    rootGroup.localToWorld(ikTarget)
    ikPole.set(s * 0.6, -1, -0.5).applyQuaternion(ikRootQ)
    solveArm(arm, ikTarget, ikPole, ikPalm)

    if (prefix === 'right' && raise > 0.001) blendToWave(vrm, raise, flip)
  }

  const l = m.hands.left.offset.value
  const r = m.hands.right.offset.value
  addBone(vrm, 'chest', 0, (l.x + r.x) * 0.6 + (r.z - l.z) * 0.8, 0, flip)
  addBone(vrm, 'leftShoulder', 0, 0, m.hands.left.press * 0.015 + l.y * 0.8, flip)
  addBone(vrm, 'rightShoulder', 0, 0, -(m.hands.right.press * 0.015 + r.y * 0.8), flip)
}

function blendToWave(vrm, raise, flip) {
  for (const [name, [x, y, z]] of Object.entries(WAVE_ARM)) {
    const node = vrm.humanoid.getNormalizedBoneNode(name)
    if (!node) continue
    eTmp.set(x * flip, y, z * flip)
    node.quaternion.slerp(qTmp.setFromEuler(eTmp), raise)
  }
}

function relaxedFingers(vrm, flip, t, openRight) {
  for (const prefix of ['left', 'right']) {
    const sign = prefix === 'left' ? -1 : 1
    FINGERS.forEach((f, i) => {
      const open = prefix === 'right' ? openRight : 0
      const c = RELAXED_CURL[i] * (1 - open * 0.85) + noise(t * 0.3, i + (prefix === 'left' ? 0 : 5)) * 0.03
      setBone(vrm, `${prefix}${f}Proximal`, 0, 0, sign * c * 0.8, flip)
      setBone(vrm, `${prefix}${f}Intermediate`, 0, 0, sign * c, flip)
      setBone(vrm, `${prefix}${f}Distal`, 0, 0, sign * c * 0.6, flip)
    })
  }
}

/** Eases every bone from last frame's rotation toward this frame's target, so nothing snaps. */
function smoothBones(vrm, prev, dt) {
  for (const name of [...BODY_BONES, ...FINGER_BONES]) {
    const node = vrm.humanoid.getNormalizedBoneNode(name)
    if (!node) continue
    const last = prev.get(name)
    if (!last) {
      prev.set(name, node.quaternion.clone())
      continue
    }
    node.quaternion.copy(last.slerp(node.quaternion, 1 - Math.exp(-SMOOTH_RATE(name) * dt)))
  }
}

/**
 * Animated VRM character.
 * mode "sit": types on the laptop; "stand": idles for the webcam.
 * waveRef: start time (performance seconds) of a 3-second wave.
 * lookAtRef: world-space Vector3 of the viewer. attentionRef: 0..1, how likely she glances at them.
 */
export default function Avatar({ mode = 'sit', waveRef, lookAtRef, attentionRef, onReady, ...props }) {
  const [vrm, setVrm] = useState(null)
  const root = useRef(null)
  const motionRef = useRef(null)

  useEffect(() => {
    let alive = true
    let instance = null
    loadVRM().then((loaded) => {
      if (!alive) {
        VRMUtils.deepDispose(loaded.scene)
        return
      }
      instance = loaded
      setVrm(loaded)
    })
    return () => {
      alive = false
      if (instance) VRMUtils.deepDispose(instance.scene)
    }
  }, [])

  useEffect(() => {
    if (!vrm) return
    const anchors = placeOnFloor(vrm, root.current, mode === 'sit')
    motionRef.current = createMotion(anchors, vrm)
    onReady?.(anchors)
  }, [vrm, mode, onReady])

  useFrame((state, delta) => {
    const m = motionRef.current
    if (!vrm || !m) return
    const dt = Math.min(delta, 1 / 20)
    const now = performance.now() / 1000
    const t = state.clock.elapsedTime
    const flip = vrm.meta?.metaVersion === '0' ? -1 : 1
    const sit = mode === 'sit'
    const hum = vrm.humanoid
    const attention = m.attention.step(attentionRef?.current ?? 1, 3, dt)

    const waveStart = waveRef?.current ?? -99
    const waveT = now - waveStart
    if (waveStart !== m.lastWave && waveT >= 0) {
      m.lastWave = waveStart
      m.wavePhase = 0
    }
    const raise = waveRaise(waveT)
    const swing = waveSwing(waveT)
    // She looks at the viewer while the hand is up, then back down at the laptop as it lowers.
    const greeting = waveT >= 0 && waveT < WAVE_DURATION - 0.7

    applyPose(vrm, sit ? POSES.sit : POSES.stand, flip)

    // Breathing with an irregular rhythm, plus slow weight shifts.
    m.breath += dt * ((Math.PI * 2) / (4.2 + 0.8 * noise(t * 0.07, 3)))
    const breath = Math.sin(m.breath)
    addBone(vrm, 'spine', 0.008 * breath, 0.025 * noise(t * 0.11, 1), 0.018 * noise(t * 0.09, 2), flip)
    addBone(vrm, 'chest', -0.016 * breath, 0, 0, flip)
    addBone(vrm, 'leftShoulder', 0, 0, 0.012 * Math.max(0, breath), flip)
    addBone(vrm, 'rightShoulder', 0, 0, -0.012 * Math.max(0, breath), flip)
    if (!sit) {
      const shift = 0.035 * noise(t * 0.12, 4)
      addBone(vrm, 'hips', 0, 0.02 * noise(t * 0.08, 6), shift, flip)
      addBone(vrm, 'spine', 0, 0, -shift * 0.7, flip)
      addBone(vrm, 'leftUpperLeg', 0, 0, -shift, flip)
      addBone(vrm, 'rightUpperLeg', 0, 0, -shift, flip)
      addBone(vrm, 'leftUpperArm', 0.02 * breath, 0, 0.03 * noise(t * 0.2, 8), flip)
      addBone(vrm, 'rightUpperArm', 0.02 * breath, 0, 0.03 * noise(t * 0.2, 9), flip)
    }

    // Where she looks.
    if (greeting) {
      m.gazeMode = 'viewer'
      m.gazeUntil = now + rand(0.6, 1.4)
      m.focusUntil = now + 0.7 + rand(5, 7)
    } else if (sit) {
      scheduleTyping(m, now, attention)
      if (now < m.focusUntil && m.gazeMode === 'viewer') {
        m.gazeMode = 'keys'
        m.gazeUntil = now + rand(2, 3.5)
      }
    }
    scheduleGaze(m, now, attention, sit)

    const viewer = lookAtRef?.current
    const mid = v1.addVectors(m.anchors.leftHand, m.anchors.rightHand).multiplyScalar(0.5)
    let target
    if (m.gazeMode === 'viewer' && viewer) target = v2.copy(viewer)
    else if (!sit) target = root.current.localToWorld(v2.set(noise(t * 0.4, 1) * 0.6, m.anchors.head.y + 0.1, 2))
    else if (m.gazeMode === 'screen') target = root.current.localToWorld(v2.copy(mid).add(v1.set(0, 0.17, 0.16)))
    else target = root.current.localToWorld(v2.copy(mid).add(v1.set(0, -0.02, 0.04)))
    const gaze = m.gaze.step(target, sit ? 5.5 : 4.5, dt)

    // Arms.
    if (sit && m.arms.left && m.arms.right) {
      typeWithIK(vrm, root.current, m, now, dt, raise, flip)
    } else {
      relaxedFingers(vrm, flip, t, raise)
      if (raise > 0.001) blendToWave(vrm, raise, flip)
    }
    if (sit) relaxedFingersWave(vrm, flip, raise)

    if (swing > 0.001) {
      m.wavePhase += dt * Math.PI * 2 * (2.1 + 0.2 * noise(t * 0.8, 11))
      addBone(vrm, 'rightLowerArm', 0, 0, Math.sin(m.wavePhase) * 0.32 * swing, flip)
      addBone(vrm, 'rightHand', 0, 0, Math.sin(m.wavePhase - 0.7) * 0.22 * swing, flip)
      addBone(vrm, 'chest', 0, 0, Math.sin(m.wavePhase - 0.3) * 0.012 * swing, flip)
    }

    // Head and neck turn toward the gaze point, shared down the spine.
    const headNode = hum.getNormalizedBoneNode('head')
    if (headNode) {
      headNode.getWorldPosition(v1)
      root.current.getWorldQuaternion(qInv).invert()
      v1.subVectors(gaze, v1).applyQuaternion(qInv)
      const lean = sit ? 0.24 : 0.02
      const yaw = THREE.MathUtils.clamp(Math.atan2(v1.x, v1.z), -1, 1) + 0.03 * noise(t * 0.35, 12)
      const pitch = THREE.MathUtils.clamp(-Math.atan2(v1.y, Math.hypot(v1.x, v1.z)), -0.5, 0.75) - lean + 0.02 * noise(t * 0.3, 13)
      const roll = 0.035 * noise(t * 0.17, 14) + (greeting ? 0.06 * raise : 0)
      addBone(vrm, 'upperChest', 0, yaw * 0.12, 0, flip)
      addBone(vrm, 'neck', pitch * 0.4, yaw * 0.33, roll * 0.4, flip)
      addBone(vrm, 'head', pitch * 0.6, yaw * 0.55, roll * 0.6, flip)
    }

    smoothBones(vrm, m.prev, dt)

    // Eyes: follow the gaze point with small, quick saccades.
    if (now > m.saccadeAt) {
      m.saccade.set(rand(-0.03, 0.03), rand(-0.02, 0.02), 0)
      m.saccadeAt = now + rand(0.35, 1.8)
    }
    vrm.lookAt?.lookAt(v1.copy(gaze).add(m.saccade))

    // Irregular blinks, sometimes doubled.
    const em = vrm.expressionManager
    if (em) {
      if (now > m.nextBlink) {
        m.blinkStart = now
        m.blinkLength = rand(0.13, 0.19)
        m.doubleBlink = !m.doubleBlink && Math.random() < 0.15
        m.nextBlink = now + (m.doubleBlink ? m.blinkLength * 2.4 : rand(2, 6.5))
      }
      em.setValue('blink', blinkCurve((now - m.blinkStart) / m.blinkLength))
    }

    vrm.update(dt)
    const wantSmile = greeting ? 0.75 : m.gazeMode === 'viewer' ? 0.55 : 0.2
    applyFace(m.faces, THREE.MathUtils.clamp(m.smile.step(wantSmile, 3.5, dt), 0, 1), em?.getValue('blink') ?? 0)
  })

  return (
    <group ref={root} {...props}>
      {vrm && <primitive object={vrm.scene} />}
    </group>
  )
}

/** Seated wave: the raised hand opens its fingers. */
function relaxedFingersWave(vrm, flip, raise) {
  if (raise <= 0.001) return
  FINGERS.forEach((f) => {
    for (const g of SEGMENTS) {
      const node = vrm.humanoid.getNormalizedBoneNode(`right${f}${g}`)
      if (node) node.rotation.z *= 1 - raise * 0.85
    }
  })
}
