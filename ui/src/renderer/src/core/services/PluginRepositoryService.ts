import {
  MAX_TAGS_PER_SEARCH,
  PluginCategory,
  RepositoryPluginDetail,
  RepositoryPluginsPage,
  RepositoryRelease,
  RepositoryTag
} from "../types/RepositoryPlugin"
import repositoryAxios from "../lib/repositoryAxios"
import {
  DEFAULT_REPOSITORY_HOST,
  buildBaseUrl,
  buildPluginWebUrl,
  normalizeHost
} from "../lib/repositoryUrls"
import pluginService from "./PluginService"
import { Plugin } from "../types/Plugin"
import { compareVersions } from "../utils/compareVersions"

export { DEFAULT_REPOSITORY_HOST, buildPluginWebUrl, normalizeHost }

type Release = RepositoryPluginDetail["releases"][number]

/**
 * Returns the release with the highest semantic version (`name` is `x.y.z`), or
 * `undefined` when there are no releases. Used to decide which release to download and
 * to compare against the installed version.
 */
export function latestRelease(releases: Release[]): Release | undefined {
  return releases.reduce<Release | undefined>(
    (latest, release) =>
      latest === undefined || compareVersions(release.name, latest.name) > 0 ? release : latest,
    undefined
  )
}

/** An installed plugin as sent to the repository's `/plugins/check-updates` endpoint. */
export type InstalledPluginRef = {
  /** `publisher.plugin`, matching the plugin's local `id`. */
  slug: string
  /** Installed version, `x.y.z`. */
  version: string
}

export type SearchPluginsParams = {
  /** Free text query. The backend requires at least 2 characters; shorter values must be omitted. */
  query?: string
  category?: PluginCategory
  tags?: string[]
  page?: number
  perPage?: number
}

type ReleaseAsset = RepositoryPluginDetail["releases"][number]["assets"][number]

function selectAssetForPlatform(
  assets: ReleaseAsset[],
  platform: string
): ReleaseAsset | undefined {
  const platformMap: Record<string, string[]> = {
    win32: ["windows", "win32", "win"],
    darwin: ["macos", "darwin", "mac", "osx"],
    linux: ["linux"]
  }
  const candidates = platformMap[platform] ?? [platform]
  return assets.find((a) => candidates.some((c) => a.so.toLowerCase().includes(c)))
}

/**
 * Whether `release` ships an asset for `platform`, i.e. whether it can actually be
 * downloaded and installed on this machine. Used to enable/disable the per-release
 * install/update action in the detail view.
 */
export function hasCompatibleAsset(release: Release, platform: string): boolean {
  return selectAssetForPlatform(release.assets, platform) !== undefined
}

class PluginRepositoryService {
  async initialize(): Promise<void> {
    const savedHost = await window.core.preferences.get("pluginRepository:host")
    this.setHost((savedHost as string) || DEFAULT_REPOSITORY_HOST)
  }

  /**
   * Points the client at `host`, rebuilding the scheme and the API path around it.
   *
   * @param host - A host (`localhost:8001`) or a full URL.
   */
  setHost(host: string): void {
    repositoryAxios.defaults.baseURL = buildBaseUrl(host)
  }

  /**
   * Searches plugins through the repository `/search` endpoint, supporting an optional
   * text query plus category and tag filters. Returns the full paginated page so callers
   * can access pagination metadata.
   */
  async search(params: SearchPluginsParams = {}): Promise<RepositoryPluginsPage> {
    const { query, category, tags, page = 1, perPage = 10 } = params
    const response = await repositoryAxios.get<RepositoryPluginsPage>("/plugins/search", {
      params: {
        ...(query ? { query } : {}),
        ...(category ? { category } : {}),
        ...(tags && tags.length ? { tags: tags.slice(0, MAX_TAGS_PER_SEARCH) } : {}),
        page,
        per_page: perPage
      },
      // Serialize array params as repeated keys (`tags=a&tags=b`) to match FastAPI's List[str].
      paramsSerializer: { indexes: null }
    })
    return response.data
  }

  /** Lists existing tags, used to seed the tag filter. */
  async listTags(limit = 100): Promise<RepositoryTag[]> {
    const response = await repositoryAxios.get<RepositoryTag[]>("/tags", { params: { limit } })
    return response.data
  }

  /** Autocompletes tags by prefix for the tag filter. */
  async searchTags(query: string, limit = 20): Promise<RepositoryTag[]> {
    const response = await repositoryAxios.get<RepositoryTag[]>("/tags/search", {
      params: { query, limit }
    })
    return response.data
  }

  /**
   * Asks the repository whether any installed plugin has a higher-version release available.
   * Purely informative: the response is a single boolean, with no per-plugin detail (which
   * versions are outdated is intentionally not revealed). Returns `false` without a request
   * when the list is empty.
   *
   * @param installed - Installed plugins as `{ slug: "publisher.plugin", version: "x.y.z" }`.
   */
  async checkUpdates(installed: InstalledPluginRef[]): Promise<boolean> {
    if (installed.length === 0) return false
    const response = await repositoryAxios.post<{ updates_available: boolean }>(
      "/plugins/check-updates",
      { plugins: installed }
    )
    return response.data.updates_available
  }

  async getBySlug(publisherSlug: string, pluginSlug: string): Promise<RepositoryPluginDetail> {
    const response = await repositoryAxios.get<RepositoryPluginDetail>(
      `/plugins/${publisherSlug}.${pluginSlug}`
    )
    return response.data
  }

  /**
   * Lists every release of a plugin from the dedicated `/releases` router, keyed by the
   * plugin's repository id (`_id`). Unlike the `releases` array embedded in the plugin
   * detail, this is not capped, so it is the source for the full release history.
   *
   * @param repositoryId - The plugin's `_id` (a release's `repository_id`).
   */
  async getReleases(repositoryId: string): Promise<RepositoryRelease[]> {
    const response = await repositoryAxios.get<RepositoryRelease[]>(
      `/releases/repository/${repositoryId}`
    )
    return response.data
  }

  /**
   * Downloads the `release` asset matching the current platform and builds a zip `File`
   * ready to be registered or used to update an installed plugin. Uses the asset's direct
   * `browser_download_url`, so it needs neither the repository URL nor the GitHub API.
   */
  private async downloadReleaseFile(release: Release): Promise<File> {
    const platform = window.core.app.platform
    const asset = selectAssetForPlatform(release.assets, platform)
    if (!asset) {
      throw new Error(`No compatible release found for your operating system (${platform})`)
    }
    if (!asset.browser_download_url) {
      throw new Error(`Asset "${asset.name}" has no download URL`)
    }

    const arrayBuffer = await window.core.plugins.downloadAsset(asset.browser_download_url)
    return new File([arrayBuffer], asset.name, { type: "application/zip" })
  }

  /** Installs a specific `release` of a plugin. */
  async installPlugin(release: Release): Promise<Plugin> {
    const file = await this.downloadReleaseFile(release)
    return pluginService.register(file)
  }

  /**
   * Atomically replaces an already installed plugin with a specific `release` from the
   * repository, keeping the same final ID. The download happens before the old plugin is
   * touched (see the runtime-specific update paths). `release` need not be the latest: any
   * version other than the installed one can be selected from the detail view.
   */
  async updatePlugin(installed: Plugin, release: Release): Promise<Plugin> {
    const file = await this.downloadReleaseFile(release)
    return pluginService.update(file, installed.id, installed.target)
  }
}

const pluginRepositoryService = new PluginRepositoryService()
export default pluginRepositoryService
