/**
 * @module repositoryHelpers
 * Pure helpers for the plugin repository views. Kept free of React and `window.core` so
 * they can be unit-tested in isolation.
 */
import { RepositoryRelease } from "../../../types/RepositoryPlugin"
import { compareVersions } from "../../../utils/compareVersions"

/**
 * The `{publisher}.{plugin}` identifier of a repository plugin. Matches the installed
 * plugin's `id`, so it is the key used to look a plugin up in the installed-plugins map
 * and the last segment of its route.
 */
export function pluginKey(plugin: { publisher_slug: string; slug?: string }): string {
  return `${plugin.publisher_slug}.${plugin.slug}`
}

/**
 * Splits a route slug (`{publisher}.{plugin}`) into its parts. The first dot separates the
 * publisher from the plugin slug (which itself never contains a dot).
 */
export function parseSlug(routeSlug: string): { publisherSlug: string; pluginSlug: string } {
  const dotIndex = routeSlug.indexOf(".")
  return {
    publisherSlug: routeSlug.substring(0, dotIndex),
    pluginSlug: routeSlug.substring(dotIndex + 1)
  }
}

/**
 * Whether `release` is a strictly higher semantic version than `installedVersion`.
 * A missing release (`null`/`undefined`) is never newer.
 *
 * Single source of truth for the "update available" decision, shared by the list dot
 * (`hasUpdate`) and the detail button (`installStateFor`), so they cannot disagree.
 */
export function isNewerRelease(
  release: RepositoryRelease | null | undefined,
  installedVersion: string
): boolean {
  return release != null && compareVersions(release.name, installedVersion) > 0
}
