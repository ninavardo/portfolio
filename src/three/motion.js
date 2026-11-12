import * as THREE from 'three'

export const clamp01 = (t) => Math.min(1, Math.max(0, t))
export const rand = (a, b) => a + Math.random() * (b - a)

export function easeInOut(t) {
  const x = clamp01(t)
  return x < 0.5 ? 4 * x * x * x : 1 - (-2 * x + 2) ** 3 / 2
}

/** Smooth, non-repeating wobble in roughly [-1, 1]. */
export function noise(t, seed = 0) {
  return (Math.sin(t + seed * 1.7) + 0.6 * Math.sin(t * 1.618 + seed * 2.9) + 0.3 * Math.sin(t * 2.718 + seed * 4.3)) / 1.9
}

/** Critically damped spring: eases in and out toward its target with no overshoot. */
export class Spring {
  constructor(value = 0) {
    this.value = value
    this.velocity = 0
  }

  step(target, omega, dt) {
    const x = this.value - target
    const e = Math.exp(-omega * dt)
    const k = this.velocity + omega * x
    this.value = target + (x + k * dt) * e
    this.velocity = (this.velocity - omega * k * dt) * e
    return this.value
  }
}

export class Spring3 {
  constructor(v = new THREE.Vector3()) {
    this.value = v.clone()
    this.velocity = new THREE.Vector3()
  }

  step(target, omega, dt) {
    const e = Math.exp(-omega * dt)
    for (const axis of ['x', 'y', 'z']) {
      const x = this.value[axis] - target[axis]
      const k = this.velocity[axis] + omega * x
      this.value[axis] = target[axis] + (x + k * dt) * e
      this.velocity[axis] = (this.velocity[axis] - omega * k * dt) * e
    }
    return this.value
  }
}

export const WAVE_DURATION = 3

/** How far the arm is raised during a wave: eased up, held, eased down, all inside 3 seconds. */
export function waveRaise(t) {
  if (t < 0 || t > WAVE_DURATION) return 0
  if (t < 0.7) return easeInOut(t / 0.7)
  if (t > 2.3) return 1 - easeInOut((t - 2.3) / 0.7)
  return 1
}

/** How strongly the hand swings side to side: fades in after the raise, out before lowering. */
export function waveSwing(t) {
  if (t < 0 || t > WAVE_DURATION) return 0
  return easeInOut((t - 0.4) / 0.5) * (1 - easeInOut((t - 1.95) / 0.45))
}

/** Blink lid curve: closes quickly, opens a little slower. */
export function blinkCurve(u) {
  if (u < 0 || u > 1) return 0
  return u < 0.35 ? easeInOut(u / 0.35) : 1 - easeInOut((u - 0.35) / 0.65)
}

/** A soft key press: 0 → 1 → 0 over the tap. */
export const tapCurve = (u) => (u < 0 || u > 1 ? 0 : Math.sin(Math.PI * u) ** 2)
