/**
 * Compares two semantic version strings (`x.y.z`, optionally prefixed with `v`).
 * Returns a negative number if `a < b`, zero if they are equal, and a positive number
 * if `a > b`. Missing or non-numeric components are treated as 0.
 */
export function compareVersions(a: string, b: string): number {
  const parse = (v: string): number[] =>
    v
      .replace(/^v/i, "")
      .split(".")
      .map((n) => parseInt(n, 10) || 0)

  const pa = parse(a)
  const pb = parse(b)
  const length = Math.max(pa.length, pb.length)
  for (let i = 0; i < length; i++) {
    const diff = (pa[i] ?? 0) - (pb[i] ?? 0)
    if (diff !== 0) return diff
  }
  return 0
}
