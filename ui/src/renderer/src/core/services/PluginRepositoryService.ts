import {
  RepositoryPlugin,
  RepositoryPluginDetail,
  RepositoryPluginsPage
} from "../types/RepositoryPlugin"
import repositoryAxios, { DEFAULT_REPOSITORY_URL } from "../lib/repositoryAxios"
import pluginService from "./PluginService"
import { Plugin } from "../types/Plugin"

export { DEFAULT_REPOSITORY_URL }

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

  async getAll(): Promise<RepositoryPlugin[]> {
    const response = await repositoryAxios.get<RepositoryPluginsPage>("")
    return response.data.items
  }

  async getBySlug(publisherSlug: string, pluginSlug: string): Promise<RepositoryPluginDetail> {
    const response = await repositoryAxios.get<RepositoryPluginDetail>(
      `/${publisherSlug}.${pluginSlug}`
    )
    return response.data
  }

  async installPlugin(detail: RepositoryPluginDetail): Promise<Plugin> {
    if (!detail.repository_url) {
      throw new Error("Plugin has no repository URL")
    }

    const release = detail.releases[0]
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
    const file = new File([arrayBuffer], asset.name, { type: "application/zip" })
    return pluginService.register(file)
  }
}

const pluginRepositoryService = new PluginRepositoryService()
export default pluginRepositoryService
