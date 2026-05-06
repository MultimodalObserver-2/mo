import axios from "axios"
import { RepositoryPlugin, RepositoryPluginDetail, RepositoryPluginsPage } from "../types/RepositoryPlugin"

const REPOSITORY_API_URL =
  import.meta.env.VITE_REPOSITORY_API_URL || "http://localhost:8001/api/v1/plugins"

const repositoryAxios = axios.create({
  baseURL: REPOSITORY_API_URL,
  headers: { "Content-type": "application/json" }
})

class PluginRepositoryService {
  async getAll(): Promise<RepositoryPlugin[]> {
    const response = await repositoryAxios.get<RepositoryPluginsPage>("")
    return response.data.items
  }

  async getBySlug(publisherSlug: string, pluginSlug: string): Promise<RepositoryPluginDetail> {
    const response = await repositoryAxios.get<RepositoryPluginDetail>(
      `/slug/${publisherSlug}.${pluginSlug}`
    )
    return response.data
  }
}

const pluginRepositoryService = new PluginRepositoryService()
export default pluginRepositoryService
