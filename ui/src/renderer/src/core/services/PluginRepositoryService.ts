import {
  RepositoryPlugin,
  RepositoryPluginDetail,
  RepositoryPluginsPage
} from "../types/RepositoryPlugin"
import repositoryAxios, { DEFAULT_REPOSITORY_URL } from "../lib/repositoryAxios"

export { DEFAULT_REPOSITORY_URL }

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
}

const pluginRepositoryService = new PluginRepositoryService()
export default pluginRepositoryService
