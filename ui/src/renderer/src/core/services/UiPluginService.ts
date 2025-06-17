import { Plugin } from "../types/Plugin"
import { PLUGIN_BASE_PATH } from "../plugin/constants"
import pluginManager from "../plugin/PluginManager"
import { getFolderName } from "../utils/getFolderName"
import { PluginDTO } from "../plugin/types/PluginDTO"

export class UiPluginService {
  readonly endpoint = "/plugins"

  async register(pluginFile: File): Promise<Plugin> {
    const fileName = pluginFile.name.replace(/\.[^/.]+$/, "")
    const folderName = await getFolderName(PLUGIN_BASE_PATH, fileName) // Remove file extension for folder name
    const destPath = await window.core.path.join(PLUGIN_BASE_PATH, folderName)
    const arrayBuffer = await pluginFile.arrayBuffer()

    const response = await window.core.zip.extract(arrayBuffer, destPath)
    if (!response.success) {
      throw new Error(`Failed to extract plugin: ${response.error}`)
    }

    return pluginManager.registerPlugin(destPath)
  }

  getAll(): Plugin[] {
    return pluginManager.getPluginsMetadata()
  }

  get(id: string): Plugin {
    return pluginManager.getPluginDtoById(id)
  }

  async delete(id: string): Promise<void> {
    const plugin = pluginManager.getPluginDtoById(id)
    if (!plugin) {
      throw new Error(`Plugin with ID ${id} not found`)
    }
    pluginManager.removePlugin(id)
    try {
      if (await window.core.fs.existsSync(plugin.location)) {
        await window.core.fs.rmSync(plugin.location, { recursive: true, force: true })
      } else {
        throw new Error(`Plugin directory does not exist: ${plugin.location}`)
      }
    } catch (error) {
      pluginManager.registerPlugin(plugin.location) // Reload the plugin if deletion fails
      throw new Error(`Failed to delete plugin: ${error}`)
    }
  }

  async loadAll(): Promise<void> {
    await pluginManager.loadAllPlugins()
  }

  async registerByDir(dir: string): Promise<PluginDTO> {
    return await pluginManager.registerPluginByDir(dir)
  }

  async getPluginDirName(pluginId: string): Promise<string> {
    return pluginManager.getPluginDirNameById(pluginId)
  }
}

const uiPluginService = new UiPluginService()
export default uiPluginService
