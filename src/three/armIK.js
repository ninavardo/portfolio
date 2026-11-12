import * as THREE from 'three'

const S = new THREE.Vector3()
const E = new THREE.Vector3()
const T = new THREE.Vector3()
const dir = new THREE.Vector3()
const pole = new THREE.Vector3()
const v = new THREE.Vector3()
const fwd = new THREE.Vector3()
const down = new THREE.Vector3()
const parentQ = new THREE.Quaternion()
const worldQ = new THREE.Quaternion()
const mA = new THREE.Matrix4()
const mB = new THREE.Matrix4()
const bSide = new THREE.Vector3()

const restDirOf = (child) => child.position.clone().normalize()

/** Rest lengths and directions of one arm chain, measured from the normalized (T-pose) rig. */
export function measureArm(humanoid, prefix) {
  const upper = humanoid.getNormalizedBoneNode(`${prefix}UpperArm`)
  const lower = humanoid.getNormalizedBoneNode(`${prefix}LowerArm`)
  const hand = humanoid.getNormalizedBoneNode(`${prefix}Hand`)
  const finger = humanoid.getNormalizedBoneNode(`${prefix}MiddleProximal`)
  if (!upper || !lower || !hand) return null
  return {
    upper,
    lower,
    hand,
    upperLen: lower.position.length(),
    lowerLen: hand.position.length(),
    upperRest: restDirOf(lower),
    lowerRest: restDirOf(hand),
    handRest: finger ? restDirOf(finger) : restDirOf(hand),
    palmRest: new THREE.Vector3(0, -1, 0),
  }
}

function basis(out, forward, normal) {
  bSide.crossVectors(forward, normal).normalize()
  return out.makeBasis(forward, normal, bSide)
}

/** World rotation that maps a bone's rest (forward, palm) pair onto the wanted pair. */
function orient(bone, restF, restN, wantF, wantN) {
  down.copy(wantN).addScaledVector(wantF, -wantN.dot(wantF)).normalize()
  basis(mA, wantF, down)
  basis(mB, restF, restN)
  worldQ.setFromRotationMatrix(mA.multiply(mB.transpose()))
  bone.parent.getWorldQuaternion(parentQ)
  bone.quaternion.copy(parentQ.invert().multiply(worldQ))
  bone.updateMatrixWorld(true)
}

/**
 * Two-bone IK: puts the hand on `target` (world), elbow bent toward `poleDir` (world),
 * palm facing `palmDir`. Writes quaternions on the normalized bones.
 */
export function solveArm(arm, target, poleDir, palmDir) {
  const { upper, lower, hand, upperLen: a, lowerLen: b } = arm
  upper.parent.updateMatrixWorld(true)
  upper.getWorldPosition(S)
  T.copy(target)
  dir.subVectors(T, S)
  const d = THREE.MathUtils.clamp(dir.length(), Math.abs(a - b) + 1e-3, a + b - 1e-3)
  dir.normalize()
  T.copy(S).addScaledVector(dir, d)

  const cosA = THREE.MathUtils.clamp((a * a + d * d - b * b) / (2 * a * d), -1, 1)
  pole.copy(poleDir).addScaledVector(dir, -poleDir.dot(dir)).normalize()
  E.copy(S)
    .addScaledVector(dir, a * cosA)
    .addScaledVector(pole, a * Math.sqrt(1 - cosA * cosA))

  v.subVectors(E, S).normalize()
  upper.parent.getWorldQuaternion(parentQ)
  upper.quaternion.setFromUnitVectors(arm.upperRest, v.applyQuaternion(parentQ.invert()))
  upper.updateMatrixWorld(true)

  fwd.subVectors(T, E).normalize()
  orient(lower, arm.lowerRest, arm.palmRest, fwd, palmDir)

  fwd.y *= 0.3
  fwd.normalize()
  orient(hand, arm.handRest, arm.palmRest, fwd, palmDir)
}
