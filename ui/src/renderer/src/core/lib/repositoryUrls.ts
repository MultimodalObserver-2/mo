/**
 * @module repositoryUrls
 * Builds the URLs of the external plugin repository: the API base that Axios talks to,
 * and the public page of a plugin on the web platform. Preferences store only a host, so
 * the scheme and every path live here.
 */

/**
 * Where the repository API is mounted. Part of the API contract, not configurable.
 * Each router adds its own prefix below this (`/plugins`, `/tags`), so the base stops
 * at the version segment.
 */
const REPOSITORY_API_PATH = "/api/v1"

/** Route of a plugin's page on the web platform, keyed by `{publisher}.{plugin}`. */
const REPOSITORY_WEB_PLUGIN_PATH = "/plugins"

/**
 * Host of the repository API. Only the default is fixed at build time: it is overridden
 * by the `pluginRepository:host` preference whenever one is saved.
 */
export const DEFAULT_REPOSITORY_HOST =
  import.meta.env.VITE_REPOSITORY_API_HOST ||
  (import.meta.env.DEV ? "localhost:8001" : "mo.diinf.usach.cl")

/**
 * Host of the repository's web platform. In production it shares the domain with the API,
 * which hangs off `/api/v1`; in dev they are separate apps on different ports (API on
 * 8001, web on 3000). That dev split is why this cannot be derived from the API host.
 */
export const DEFAULT_REPOSITORY_WEB_HOST =
  import.meta.env.VITE_REPOSITORY_WEB_HOST ||
  (import.meta.env.DEV ? "localhost:3000" : "mo.diinf.usach.cl")

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
 * Scheme and host for `value` (`http://localhost:8001`), falling back to `fallback`.
 *
 * @throws If neither can be parsed, which means the build is misconfigured — better
 * surfaced than silently pointed elsewhere.
 */
function buildOrigin(value: string, fallback?: string): string {
  const parsed = parseHost(value) ?? (fallback ? parseHost(fallback) : undefined)
  if (!parsed) throw new Error(`Invalid repository host: ${value}`)

  const scheme = isLocalNetworkHost(parsed.hostname) ? "http" : "https"
  return `${scheme}://${parsed.host}`
}

/**
 * Builds the API base URL for `value`, falling back to the default host.
 *
 * @param value - A host (`localhost:8001`) or a full URL.
 */
export function buildBaseUrl(value: string): string {
  return `${buildOrigin(value, DEFAULT_REPOSITORY_HOST)}${REPOSITORY_API_PATH}`
}

/**
 * Builds the URL of a plugin's page on the repository web platform, for opening in the
 * user's browser.
 *
 * @param publisherSlug - The publisher's slug (`interaction-lab`).
 * @param pluginSlug - The plugin's slug (`keyboard-capture`).
 */
export function buildPluginWebUrl(publisherSlug: string, pluginSlug: string): string {
  const origin = buildOrigin(DEFAULT_REPOSITORY_WEB_HOST)
  const slug = `${encodeURIComponent(publisherSlug)}.${encodeURIComponent(pluginSlug)}`
  return `${origin}${REPOSITORY_WEB_PLUGIN_PATH}/${slug}`
}
