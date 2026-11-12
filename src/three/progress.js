const listeners = new Set()
let progress = 0

export function setProgress(value) {
  progress = value
  listeners.forEach((fn) => fn(value))
}

export function onModelProgress(fn) {
  listeners.add(fn)
  fn(progress)
  return () => listeners.delete(fn)
}
