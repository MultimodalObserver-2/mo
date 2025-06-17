import { PluginBase } from "./types/PluginBase"
import { PluginMetadata } from "./types/PluginMetadata"
import { validateId } from "./utils/validateId"
import { PluginDTO } from "./types/PluginDTO"
import { PLUGIN_BASE_PATH } from "./constants"

interface PluginConstructor {
  new (): PluginBase
  __module?: string
}

interface InternalPlugin {
  id: string
  pluginClass?: PluginConstructor
  metadata: PluginMetadata
  location: string
  dirName: string
  module?: string
  error?: string
  is_loaded: boolean
}

class PluginManager {
  private plugins: Map<string, InternalPlugin> = new Map()
  private entryPoints = {
    renderer: "mo.ui.plugin.renderer"
  }

  async loadAllPlugins(): Promise<void> {
    const dirs = await window.core.fs.readdirSync(PLUGIN_BASE_PATH)

    const pluginDirPromises = dirs.map(async (dir) => {
      const dirPath = await window.core.path.join(PLUGIN_BASE_PATH, dir)
      if (await window.core.fs.isDirectory(dirPath)) {
        return dirPath
      }
      return null
    })

    const pluginDirs = (await Promise.all(pluginDirPromises)).filter(
      (dirPath): dirPath is string => dirPath !== null
    )

    for (const pluginPath of pluginDirs) {
      try {
        await this.registerPlugin(pluginPath)
      } catch (error) {
        console.error(`Failed to register plugin at ${pluginPath}:`, error)
      }
    }
  }

  private getEntryPoint(metadata: PluginMetadata, group: string): string {
    const entryPoints = metadata.entryPoints
    if (!entryPoints) {
      throw new Error(`Plugin ${metadata.id} does not define a valid entry point`)
    }
    const entry = entryPoints[group]
    if (!entry) {
      throw new Error(`Plugin ${metadata.id} does not define an entry point for group "${group}"`)
    }

    return entry.startsWith("./") ? entry.slice(2) : entry
  }

  async registerPlugin(pluginPath: string): Promise<PluginDTO> {
    const metadataPath = await window.core.path.join(pluginPath, "metadata.json")
    if (!(await window.core.fs.existsSync(metadataPath))) {
      throw new Error(`Plugin metadata not found at ${metadataPath}`)
    }

    const dirName = await window.core.path.basename(pluginPath)

    const metadataContent = await window.core.fs.readFileSync(metadataPath, "utf-8")
    const rawMetadata = JSON.parse(
      typeof metadataContent === "string" ? metadataContent : metadataContent.toString("utf-8")
    ) as PluginMetadata

    validateId(rawMetadata.id)
    validateId(rawMetadata.publisher.id)

    const fullId = this.getPluginFinalId(rawMetadata)
    if (this.plugins.has(fullId)) {
      throw new Error(`Plugin ID already loaded: ${fullId}`)
    }

    try {
      const relPath = this.getEntryPoint(rawMetadata, this.entryPoints.renderer)
      const entry = await window.core.path.join(pluginPath, relPath)
      const pluginModule = await import(/* @vite-ignore */ entry)
      if (!pluginModule.default) throw new Error(`Plugin at ${entry} must export default`)

      const pluginClass = pluginModule.default as PluginConstructor
      const moduleName = pluginClass.__module ?? "core"
      new pluginClass()

      const internalPlugin: InternalPlugin = {
        id: fullId,
        pluginClass: pluginClass,
        metadata: rawMetadata,
        location: pluginPath,
        dirName: dirName,
        module: moduleName,
        is_loaded: true
      }
      this.plugins.set(fullId, internalPlugin)
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      const internalPlugin: InternalPlugin = {
        id: fullId,
        metadata: rawMetadata,
        location: pluginPath,
        dirName: dirName,
        error: errorMessage,
        is_loaded: false
      }
      this.plugins.set(fullId, internalPlugin)
    }
    return this.getPluginDtoById(fullId)
  }

  async registerPluginByDir(dir: string): Promise<PluginDTO> {
    const pluginPath = await window.core.path.join(PLUGIN_BASE_PATH, dir)
    return this.registerPlugin(pluginPath)
  }

  async removeAll(): Promise<void> {
    this.plugins.clear()
  }

  async removePlugin(pluginId: string): Promise<void> {
    const plugin = this.plugins.get(pluginId)
    if (!plugin) {
      throw new Error(`Plugin with ID ${pluginId} not found`)
    }

    this.plugins.delete(pluginId)
  }

  getPluginsByType<T extends PluginBase>(cls: new (...args: unknown[]) => T): T[] {
    return Array.from(this.plugins.values())
      .filter(
        (p): p is InternalPlugin & { instance: T } => p.is_loaded && p.pluginClass instanceof cls
      )
      .map((p) => p.instance)
  }

  getPluginsMetadata(): PluginDTO[] {
    return Array.from(this.plugins.values()).map((p) => this.pluginInternalToDto(p))
  }

  private pluginInternalToDto(plugin: InternalPlugin): PluginDTO {
    return {
      id: plugin.id,
      name: plugin.metadata.name,
      description: plugin.metadata.description,
      version: plugin.metadata.version,
      publisher: {
        name: plugin.metadata.publisher.name,
        url: plugin.metadata.publisher.url
      },
      repository: plugin.metadata.repository ?? "",
      icon_path:
        typeof plugin.metadata?.icon === "object" && plugin.metadata?.icon !== null
          ? {
              light: plugin.metadata.icon.light ?? "",
              dark: plugin.metadata.icon.dark ?? ""
            }
          : (plugin.metadata?.icon ?? ""),
      author: plugin.metadata.author,
      platforms: {
        linux: plugin.metadata.platform?.linux ?? false,
        windows: plugin.metadata.platform?.windows ?? false,
        macos: plugin.metadata.platform?.macos ?? false
      },
      target: plugin.metadata.target,
      location: plugin.location,
      module: plugin.module,
      is_loaded: plugin.is_loaded,
      error: plugin.error
    }
  }

  getPluginDtoById(id: string): PluginDTO {
    console.log(`Fetching plugin with ID: ${id}`)
    console.log(`Current plugins:`, Array.from(this.plugins.keys()))
    console.log("Plugins", this.plugins)
    const plugin = this.plugins.get(id)
    console.log(`Found plugin:`, plugin)
    if (!plugin) {
      throw new Error(`Plugin with ID ${id} not found`)
    }

    return this.pluginInternalToDto(plugin)
  }

  getPluginFinalId(metadata: PluginMetadata): string {
    return `${metadata.publisher.id}.${metadata.id}`
  }

  getPluginDirNameById(id: string): string {
    const plugin = this.plugins.get(id)
    if (!plugin) {
      throw new Error(`Plugin with ID ${id} not found`)
    }
    return plugin.dirName
  }
}

const pluginManager = new PluginManager()
export default pluginManager
