import {
  MAX_TAGS_PER_SEARCH,
  PluginCategory,
  RepositoryPluginDetail,
  RepositoryPluginsPage,
  RepositoryTag
} from "../types/RepositoryPlugin"
import repositoryAxios, { DEFAULT_REPOSITORY_URL } from "../lib/repositoryAxios"
import pluginService from "./PluginService"
import { Plugin } from "../types/Plugin"
import { compareVersions } from "../utils/compareVersions"

export { DEFAULT_REPOSITORY_URL }

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

export type SearchPluginsParams = {
  /** Free text query. The backend requires at least 2 characters; shorter values must be omitted. */
  query?: string
  category?: PluginCategory
  tags?: string[]
  page?: number
  perPage?: number
}

type ReleaseAsset = RepositoryPluginDetail["releases"][number]["assets"][number]

function parseRepoPath(repositoryUrl: string): string {
  try {
    return new URL(repositoryUrl).pathname.slice(1).replace(/\/$/, "")
  } catch {
    throw new Error(`Invalid repository URL: ${repositoryUrl}`)
  }
}

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

class PluginRepositoryService {
  async initialize(): Promise<void> {
    const savedUrl = await window.core.preferences.get("pluginRepository:url")
    this.setBaseUrl((savedUrl as string) || DEFAULT_REPOSITORY_URL)
  }

  setBaseUrl(url: string): void {
    repositoryAxios.defaults.baseURL = url
  }

  /**
   * Searches plugins through the repository `/search` endpoint, supporting an optional
   * text query plus category and tag filters. Returns the full paginated page so callers
   * can access pagination metadata.
   */
  async search(params: SearchPluginsParams = {}): Promise<RepositoryPluginsPage> {
    const { query, category, tags, page = 1, perPage = 10 } = params
    const response = await repositoryAxios.get<RepositoryPluginsPage>("/search", {
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

  async getBySlug(publisherSlug: string, pluginSlug: string): Promise<RepositoryPluginDetail> {
    const response = await repositoryAxios.get<RepositoryPluginDetail>(
      `/${publisherSlug}.${pluginSlug}`
    )
    return response.data
  }

  /**
   * Downloads the asset of the latest release matching the current platform and builds
   * a zip `File` ready to be registered or used to update an installed plugin.
   */
  private async downloadReleaseFile(detail: RepositoryPluginDetail): Promise<File> {
    if (!detail.repository_url) {
      throw new Error("Plugin has no repository URL")
    }

    const release = latestRelease(detail.releases)
    if (!release) {
      throw new Error("No releases available for this plugin")
    }

    const platform = window.core.app.platform
    const asset = selectAssetForPlatform(release.assets, platform)
    if (!asset) {
      throw new Error(`No compatible release found for your operating system (${platform})`)
    }

    const repoPath = parseRepoPath(detail.repository_url)
    const arrayBuffer = await window.core.plugins.downloadAsset(asset.asset_github_id, repoPath)
    return new File([arrayBuffer], asset.name, { type: "application/zip" })
  }

  async installPlugin(detail: RepositoryPluginDetail): Promise<Plugin> {
    const file = await this.downloadReleaseFile(detail)
    return pluginService.register(file)
  }

  /**
   * Atomically replaces an already installed plugin with the latest release from the
   * repository, keeping the same final ID. The download and validation happen before the
   * old plugin is touched (see the runtime-specific update paths).
   */
  async updatePlugin(detail: RepositoryPluginDetail, installed: Plugin): Promise<Plugin> {
    const file = await this.downloadReleaseFile(detail)
    return pluginService.update(file, installed.id, installed.target)
  }
}

const pluginRepositoryService = new PluginRepositoryService()
export default pluginRepositoryService
