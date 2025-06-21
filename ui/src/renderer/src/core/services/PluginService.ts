import { extractMetadataFromZip } from "../plugin/utils/pluginZip"
import { Plugin } from "../types/Plugin"
import { PluginProperty } from "../types/PluginProperty"
import apiPluginService, { ApiPluginService } from "./ApiPluginService"
import uiPluginService, { UiPluginService } from "./UiPluginService"

class PluginService {
  constructor(
    public api: ApiPluginService,
    public ui: UiPluginService
  ) {}

  async getAll(target?: string): Promise<Plugin[]> {
    if (target === "api") {
      const response = await this.api.getAll()
      return response.data
    }

    if (target === "ui") {
      const plugins = await this.ui.getAll()
      return plugins
    }

    const [apiPlugins, uiPlugins] = await Promise.all([
      this.api.getAll().then((res) => res.data),
      await this.ui.getAll()
    ])

    return [...apiPlugins, ...uiPlugins]
  }

  async get(pluginId: string, target: string): Promise<Plugin> {
    if (target === "api") {
      const response = await this.api.get(pluginId)
      return response.data
    } else if (target === "ui") {
      const plugin = await this.ui.get(pluginId)
      return plugin
    } else {
      throw new Error(`Unknown plugin target: ${target}`)
    }
  }

  async register(pluginFile: File): Promise<Plugin> {
    const metadata = await extractMetadataFromZip(pluginFile)
    if (metadata.target === "api") {
      const response = await this.api.register(pluginFile)
      return response.data
    }

    if (metadata.target === "ui") {
      const plugin = await this.ui.register(pluginFile)
      return plugin
    }

    throw new Error(`Unknown plugin target: ${metadata.target}`)
  }

  async delete(pluginId: string, target: string): Promise<void> {
    if (target === "api") {
      await this.api.delete(pluginId)
      return
    }

    if (target === "ui") {
      await this.ui.delete(pluginId)
      return
    }
  }

  async loadAllUiPlugins(): Promise<void> {
    await this.ui.loadAll()
  }

  async getSettingProperties(
    id: string,
    target: string,
    settings?: Record<string, unknown>
  ): Promise<PluginProperty[]> {
    if (target === "api") {
      const response = await this.api.getSettingProperties(id, settings)
      return response.data
    }
    if (target === "ui") {
      const properties = this.ui.getSettingProperties(id, settings)
      return properties
    }

    throw new Error(`Unknown plugin target: ${target}`)
  }

  async getUiPluginDirName(pluginId: string): Promise<string> {
    return this.ui.getPluginDirName(pluginId)
  }
}

const pluginService = new PluginService(apiPluginService, uiPluginService)
export default pluginService
