/**
 * @module repositoryAxios
 * Exports a preconfigured Axios instance for the external plugin repository API.
 * Preferences store only the host (`localhost:8001`); the scheme and the API path
 * are assembled here, and the base URL can be rebuilt at runtime with `buildBaseUrl`.
 */
import axios from "axios"

/**
 * Where the repository API is mounted. Part of the API contract, not configurable.
 * Each router adds its own prefix below this (`/plugins`, `/tags`), so the base stops
 * at the version segment.
 */
const REPOSITORY_API_PATH = "/api/v1"

export const DEFAULT_REPOSITORY_HOST = import.meta.env.VITE_REPOSITORY_API_HOST || "localhost:8001"

/**
 * Whether `hostname` is loopback or on a private network, the only case reached over
 * plain http. Anything else is assumed to be a deployed repository and uses https:
 * this API decides which asset gets downloaded and installed as a plugin, so it must
 * not travel in plaintext across an untrusted network.
 */
function isLocalNetworkHost(hostname: string): boolean {
  if (hostname === "localhost" || hostname.endsWith(".localhost")) return true
  // `URL.hostname` keeps the brackets around IPv6 literals.
  if (hostname === "::1" || hostname === "[::1]") return true

  const ipv4 = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/.exec(hostname)
  if (!ipv4) return false

  const first = Number(ipv4[1])
  const second = Number(ipv4[2])
  return (
    first === 127 ||
    first === 10 ||
    (first === 192 && second === 168) ||
    (first === 172 && second >= 16 && second <= 31)
  )
}

function parseHost(value: string): { host: string; hostname: string } | undefined {
  const trimmed = value.trim()
  if (!trimmed) return undefined

  // `URL` needs a scheme, so bare hosts get a placeholder one purely to be parsed.
  const hasScheme = /^[a-z][a-z0-9+.-]*:\/\//i.test(trimmed)
  try {
    const url = new URL(hasScheme ? trimmed : `http://${trimmed}`)
    return url.hostname ? { host: url.host, hostname: url.hostname } : undefined
  } catch {
    return undefined
  }
}

/**
 * Reduces a stored or typed value to a bare `host[:port]`, or `""` when it cannot be
 * parsed. Full URLs are accepted so that pasting one into settings still works.
 *
 * @param value - A host (`localhost:8001`) or a full URL.
 */
export function normalizeHost(value: string): string {
  return parseHost(value)?.host ?? ""
}

/**
 * Builds the API base URL for `value`, falling back to the default host when it cannot
 * be parsed.
 *
 * @param value - A host (`localhost:8001`) or a full URL.
 * @throws If neither `value` nor {@link DEFAULT_REPOSITORY_HOST} can be parsed, which
 * means the build is misconfigured — better surfaced than silently pointed elsewhere.
 */
export function buildBaseUrl(value: string): string {
  const parsed = parseHost(value) ?? parseHost(DEFAULT_REPOSITORY_HOST)
  if (!parsed) throw new Error(`Invalid repository host: ${value}`)

  const scheme = isLocalNetworkHost(parsed.hostname) ? "http" : "https"
  return `${scheme}://${parsed.host}${REPOSITORY_API_PATH}`
}

export default axios.create({
  baseURL: buildBaseUrl(DEFAULT_REPOSITORY_HOST),
  headers: { "Content-type": "application/json" }
})
