import { PluginBase, Properties } from "./types"
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
  properties?: Properties
  metadata: PluginMetadata
  location: string
  dirName: string
  module?: string
  error?: string
  is_loaded: boolean
}

type Constructor<T = unknown> = new (...args: unknown[]) => T

class PluginManager {
  private plugins: Map<string, InternalPlugin> = new Map()
  private entryPoints = {
    rendPlugin: "mo.ui.renderer.plugin",
    rendPluginProperties: "mo.ui.renderer.plugin.properties"
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

  private entryPointExists(metadata: PluginMetadata, group: string): boolean {
    const entryPoints = metadata.entryPoints
    if (!entryPoints) return false
    return Boolean(entryPoints[group])
  }

  private getEntryPoint(
    metadata: PluginMetadata,
    group: string
  ): { relPath: string; exportName: string } {
    const entryPoints = metadata.entryPoints
    if (!entryPoints) {
      throw new Error(`Plugin ${metadata.id} does not define a valid entry point`)
    }
    const entry = entryPoints[group]
    if (!entry) {
      throw new Error(`Plugin ${metadata.id} does not define an entry point for group "${group}"`)
    }
    const [relPath, exportName] = entry.split("#")
    return { relPath, exportName: exportName || "default" }
  }

  private async loadPluginClass(
    pluginPath: string,
    metadata: PluginMetadata
  ): Promise<PluginConstructor> {
    const { relPath, exportName } = this.getEntryPoint(metadata, this.entryPoints.rendPlugin)
    const entry = await window.core.path.join(pluginPath, relPath)

    if (!(await window.core.fs.existsSync(entry))) {
      throw new Error(`Plugin entry point not found at ${entry}`)
    }
    const pluginModule = await import(/* @vite-ignore */ entry)

    if (!pluginModule || !pluginModule[exportName]) {
      throw new Error(`Plugin entry point not found in module: ${exportName}`)
    }

    const pluginClass = pluginModule[exportName] as PluginConstructor
    if (!(pluginClass.prototype instanceof PluginBase)) {
      throw new Error(`Plugin class does not extend PluginBase`)
    }

    return pluginClass
  }

  private async loadPropertiesInstance(
    pluginPath: string,
    metadata: PluginMetadata
  ): Promise<Properties> {
    const { relPath, exportName } = this.getEntryPoint(
      metadata,
      this.entryPoints.rendPluginProperties
    )
    const entry = await window.core.path.join(pluginPath, relPath)

    if (!(await window.core.fs.existsSync(entry))) {
      throw new Error(`Plugin properties entry point not found at ${entry}`)
    }
    const propertiesModule = await import(/* @vite-ignore */ entry)

    if (!propertiesModule || !propertiesModule[exportName]) {
      throw new Error(`Plugin properties entry point not found in module: ${exportName}`)
    }

    const propertiesInstance = propertiesModule[exportName] as Properties
    if (!(propertiesInstance instanceof Properties)) {
      throw new Error(`Plugin properties does not extend Properties`)
    }

    return propertiesInstance
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
      const pluginClass = await this.loadPluginClass(pluginPath, rawMetadata)

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

      if (this.entryPointExists(rawMetadata, this.entryPoints.rendPluginProperties)) {
        const propertiesInstance = await this.loadPropertiesInstance(pluginPath, rawMetadata)
        internalPlugin.properties = propertiesInstance
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

  getPluginsByType<T extends PluginBase>(cls: Constructor): T[] {
    return Array.from(this.plugins.values())
      .filter((p) => p.is_loaded && p.pluginClass?.prototype instanceof cls)
      .map((p) => (p.pluginClass ? (new p.pluginClass() as T) : undefined))
      .filter((instance): instance is T => instance !== undefined)
  }

  getPluginsMetadata(): PluginDTO[] {
    return Array.from(this.plugins.values()).map((p) => this.pluginInternalToDto(p))
  }

  getPluginsMetadataByType<T extends PluginBase>(cls: new (...args: unknown[]) => T): PluginDTO[] {
    const pluginArray = Array.from(this.plugins.values())
    const filteredPlugins = pluginArray.filter(
      (p) => p.is_loaded && p.pluginClass?.prototype instanceof cls
    )

    return filteredPlugins.map((p) => this.pluginInternalToDto(p))
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
    const plugin = this.plugins.get(id)
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

  getPluginProperties(id: string): Properties {
    const plugin = this.plugins.get(id)
    if (!plugin) {
      throw new Error(`Plugin with ID ${id} not found`)
    }

    if (!plugin.properties) {
      return new Properties()
    }

    return plugin.properties
  }
}

const pluginManager = new PluginManager()
export default pluginManager
