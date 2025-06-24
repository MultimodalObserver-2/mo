export function deepEqual(x: unknown, y: unknown): boolean {
  if (x === y) {
    return true
  }
  if (x !== null && y !== null && typeof x === "object" && typeof y === "object") {
    if (Array.isArray(x) || Array.isArray(y)) {
      if (!Array.isArray(x) || !Array.isArray(y) || x.length !== y.length) {
        return false
      }
      for (let i = 0; i < x.length; i++) {
        if (!deepEqual(x[i], y[i])) {
          return false
        }
      }
      return true
    }
    const keysX = Object.keys(x)
    const keysY = Object.keys(y)
    if (keysX.length !== keysY.length) {
      return false
    }
    for (const key of keysX) {
      if (!keysY.includes(key) || !deepEqual(x[key], y[key])) {
        return false
      }
    }
    return true
  }
  return false
}
