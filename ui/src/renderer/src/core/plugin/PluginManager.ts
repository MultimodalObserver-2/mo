/**
 * @module core/plugin/PluginManager
 * @description
 * Singleton class for discovering, loading, registering, and managing plugins.
 * Handles plugin initialization, dynamic imports, error tracking, and
 * conversion between internal representations and DTOs for UI consumption.
 *
 * All plugins are expected to follow a metadata convention (metadata.json)
 * and provide one or more entry points for their main class and properties.
 *
 * This manager supports dynamic extension of app capabilities via plugins.
 */

import { PluginBase, Properties } from "./types"
import { PluginMetadata } from "./types/PluginMetadata"
import { validateId } from "./utils/validateId"
import { PluginDTO, PluginIcons } from "./types/PluginDTO"
import i18n from "i18next"
import { getPluginBasePath } from "./constants"

export interface PluginConstructor {
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
  private readonly plugins: Map<string, InternalPlugin> = new Map()
  private readonly entryPoints = {
    rendPlugin: "mo.ui.renderer.plugin",
    rendPluginProperties: "mo.ui.renderer.plugin.properties"
  }
  private readonly translationFileName = "translations.json"

  /**
   * Loads and registers all plugins found in the plugins directory.
   * Errors are logged and do not prevent other plugins from loading.
   */
  async loadAllPlugins(): Promise<void> {
    const dirs = await window.core.fs.readdirSync(getPluginBasePath())

    const pluginDirPromises = dirs.map(async (dir) => {
      const dirPath = await window.core.path.join(getPluginBasePath(), dir)
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

  /**
   * Checks if the plugin metadata declares an entry point for the given group.
   * @param metadata - The plugin's metadata object.
   * @param group - The entry point group to check (e.g., main class or properties).
   * @returns True if the entry point exists, false otherwise.
   */
  private entryPointExists(metadata: PluginMetadata, group: string): boolean {
    const entryPoints = metadata.entryPoints
    if (!entryPoints) return false
    return Boolean(entryPoints[group])
  }

  /**
   * Retrieves the relative path and export name of the entry point for a given group.
   * @param metadata - The plugin's metadata object.
   * @param group - The entry point group to resolve.
   * @throws Error if no entry point is defined for the group.
   * @returns An object containing { relPath, exportName }.
   */
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

  /**
   * Resolves the full file system path for a plugin entry, considering DEV and PROD environments.
   * @param pluginPath - Absolute path to the plugin root directory.
   * @param relPath - Relative path as defined in metadata.
   * @returns The full resolved file path to the entry point.
   */
  private async joinPaths(pluginPath: string, relPath: string): Promise<string> {
    if (import.meta.env.DEV) {
      return pluginPath + "/" + relPath
    }
    return await window.core.path.join(pluginPath, relPath)
  }

  /**
   * Dynamically imports and validates the main plugin class for a given plugin.
   * Ensures the class extends PluginBase.
   * @param pluginPath - Path to the plugin directory.
   * @param metadata - The plugin's metadata.
   * @throws Error if the class is missing or invalid.
   * @returns The validated PluginConstructor.
   */
  private async loadPluginClass(
    pluginPath: string,
    metadata: PluginMetadata
  ): Promise<PluginConstructor> {
    const { relPath, exportName } = this.getEntryPoint(metadata, this.entryPoints.rendPlugin)
    const entry = await this.joinPaths(pluginPath, relPath)

    if (!import.meta.env.DEV && !(await window.core.fs.existsSync(entry))) {
      throw new Error(`Plugin entry point not found at ${entry}`)
    }
    const pluginModule = await import(/* @vite-ignore */ entry)

    if (!pluginModule[exportName]) {
      throw new Error(`Plugin entry point not found in module: ${exportName}`)
    }

    const pluginClass = pluginModule[exportName] as PluginConstructor
    if (!(pluginClass.prototype instanceof PluginBase)) {
      throw new Error(`Plugin class does not extend PluginBase`)
    }

    return pluginClass
  }

  /**
   * Dynamically imports and validates the properties instance for a given plugin.
   * Ensures the instance extends Properties.
   * @param pluginPath - Path to the plugin directory.
   * @param metadata - The plugin's metadata.
   * @throws Error if the properties entry point is missing or invalid.
   * @returns The validated Properties instance.
   */
  private async loadPropertiesInstance(
    pluginPath: string,
    metadata: PluginMetadata
  ): Promise<Properties> {
    const { relPath, exportName } = this.getEntryPoint(
      metadata,
      this.entryPoints.rendPluginProperties
    )
    const entry = await this.joinPaths(pluginPath, relPath)

    if (!import.meta.env.DEV && !(await window.core.fs.existsSync(entry))) {
      throw new Error(`Plugin properties entry point not found at ${entry}`)
    }

    const propertiesModule = await import(/* @vite-ignore */ entry)

    if (!propertiesModule[exportName]) {
      throw new Error(`Plugin properties entry point not found in module: ${exportName}`)
    }

    const propertiesInstance = propertiesModule[exportName] as Properties
    if (!(propertiesInstance instanceof Properties)) {
      throw new Error(`Plugin properties does not extend Properties`)
    }

    return propertiesInstance
  }

  /**
   * Loads the plugin's localization files if defined in metadata.
   * Adds the loaded resources to i18next under the plugin's namespace.
   * @param pluginPath - Path to the plugin directory.
   * @param metadata - The plugin's metadata.
   * @returns A promise that resolves when the locales are loaded.
   * @throws Error if the locales path is invalid or loading fails.
   */
  private async loadPluginLocales(pluginPath: string, metadata: PluginMetadata): Promise<void> {
    if (!metadata.locales) return

    const resource = await window.core.i18n.loadResource(
      pluginPath,
      metadata.locales,
      i18n.language,
      this.translationFileName
    )

    if (resource) {
      i18n.addResourceBundle(i18n.language, this.getPluginNamespace(metadata), resource, true, true)
    }
  }

  /**
   * Loads the plugin's language locale for a specific language.
   * Adds the loaded resources to i18next under the plugin's namespace.
   * @param pluginId - The plugin's unique identifier.
   * @param language - The language code to load the locale for.
   * @param reload - Whether to reload the locale even if it already exists.
   * @returns A promise that resolves when the locale is loaded.
   * @throws Error if the plugin does not exist or does not define locales.
   */
  async loadPluginLanguageLocale(
    pluginId: string,
    language: string,
    reload: boolean = false
  ): Promise<void> {
    const plugin = this.plugins.get(pluginId)
    if (!plugin) {
      throw new Error(`Plugin with ID ${pluginId} not found`)
    }

    const namespace = this.getPluginNamespace(plugin.metadata)
    if (!plugin.is_loaded || (!reload && i18n.hasResourceBundle(language, namespace))) {
      return
    }

    const pluginPath = plugin.location
    await this.loadPluginLocales(pluginPath, plugin.metadata)
  }

  async loadAllPluginLanguageLocales(language: string, reload: boolean = false): Promise<void> {
    const pluginPromises = Array.from(this.plugins.values()).map(async (plugin) => {
      if (plugin.metadata.locales && plugin.is_loaded) {
        try {
          await this.loadPluginLanguageLocale(plugin.id, language, reload)
        } catch (error) {
          console.error(`Failed to load locale for plugin ${plugin.id}:`, error)
        }
      }
    })

    await Promise.all(pluginPromises)
  }

  /**
   * Registers a single plugin found at the given path.
   * Loads metadata, main class, properties (if present), and handles errors.
   * @param pluginPath - Absolute path to the plugin directory.
   * @returns The registered plugin as a DTO.
   * @throws Error if plugin is invalid or cannot be loaded.
   */
  async registerPlugin(pluginPath: string): Promise<PluginDTO> {
    const metadataPath = await window.core.path.join(pluginPath, "metadata.json")
    if (!(await window.core.fs.existsSync(metadataPath))) {
      throw new Error(`Plugin metadata not found at ${metadataPath}`)
    }

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

    const dirName = await window.core.path.basename(pluginPath)
    let loadPath = pluginPath
    if (import.meta.env.DEV) {
      loadPath = "../../plugins-dev/" + dirName
    }

    try {
      const pluginClass = await this.loadPluginClass(loadPath, rawMetadata)

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

      if (rawMetadata.locales) {
        try {
          await this.loadPluginLocales(pluginPath, rawMetadata)
        } catch (error) {
          console.error(`Failed to load locales for plugin ${fullId}:`, error)
        }
      }

      if (this.entryPointExists(rawMetadata, this.entryPoints.rendPluginProperties)) {
        const propertiesInstance = await this.loadPropertiesInstance(loadPath, rawMetadata)
        internalPlugin.properties = propertiesInstance
      }

      this.plugins.set(fullId, internalPlugin)
    } catch (error) {
      console.error(`Failed to load plugin at ${pluginPath}:`, error)
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

  /**
   * Registers a plugin by its directory name (relative to plugins base path).
   * @param dir - Directory name of the plugin.
   * @returns The registered plugin as a DTO.
   */
  async registerPluginByDir(dir: string): Promise<PluginDTO> {
    const pluginPath = await window.core.path.join(getPluginBasePath(), dir)
    return this.registerPlugin(pluginPath)
  }

  /**
   * Removes all loaded plugins from the manager.
   */
  async removeAll(): Promise<void> {
    this.plugins.clear()
  }

  /**
   * Removes a single plugin by its unique ID.
   * @param pluginId - The plugin's unique identifier.
   * @throws Error if the plugin does not exist.
   */
  async removePlugin(pluginId: string): Promise<void> {
    const plugin = this.plugins.get(pluginId)
    if (!plugin) {
      throw new Error(`Plugin with ID ${pluginId} not found`)
    }

    this.plugins.delete(pluginId)
  }

  /**
   * Returns all loaded plugin instances matching a given PluginBase subclass.
   * @param cls - The plugin class constructor to match.
   */
  getPluginsByType<T extends PluginBase>(cls: Constructor): T[] {
    return Array.from(this.plugins.values())
      .filter((p) => p.is_loaded && p.pluginClass?.prototype instanceof cls)
      .map((p) => (p.pluginClass ? (new p.pluginClass() as T) : undefined))
      .filter((instance): instance is T => instance !== undefined)
  }

  /**
   * Returns all registered plugins as DTOs (for UI use).
   */
  async getPluginsMetadata(): Promise<PluginDTO[]> {
    return Promise.all(Array.from(this.plugins.values()).map((p) => this.pluginInternalToDto(p)))
  }

  /**
   * Returns plugin DTOs filtered by plugin type (PluginBase subclass).
   * @param cls - The plugin class constructor to match.
   */
  async getPluginsMetadataByType<T extends PluginBase>(
    cls: new (...args: unknown[]) => T
  ): Promise<PluginDTO[]> {
    const pluginArray = Array.from(this.plugins.values())
    const filteredPlugins = pluginArray.filter(
      (p) => p.is_loaded && p.pluginClass?.prototype instanceof cls
    )

    return Promise.all(filteredPlugins.map((p) => this.pluginInternalToDto(p)))
  }

  /**
   * Retrieves and resolves the icon paths for a plugin, handling both object and string icon definitions.
   * @param pluginLocation - The plugin's directory location.
   * @param metadata - The plugin's metadata (must define icon/light/dark).
   * @returns Object containing absolute paths to light and dark icons.
   */
  private async getPluginIconPaths(
    pluginLocation: string,
    metadata: PluginMetadata
  ): Promise<PluginIcons> {
    if (typeof metadata.icon === "object" && metadata.icon !== null) {
      return {
        light: await window.core.path.join(pluginLocation, metadata.icon.light ?? ""),
        dark: await window.core.path.join(pluginLocation, metadata.icon.dark ?? "")
      }
    }
    return {
      light: await window.core.path.join(pluginLocation, metadata.icon ?? ""),
      dark: await window.core.path.join(pluginLocation, metadata.icon ?? "")
    }
  }

  /**
   * Converts an internal plugin representation to a PluginDTO for UI/API consumption.
   * @param plugin - The internal plugin object.
   * @returns The PluginDTO representation.
   */
  private async pluginInternalToDto(plugin: InternalPlugin): Promise<PluginDTO> {
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
      icon_path: await this.getPluginIconPaths(plugin.location, plugin.metadata),
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

  /**
   * Returns the plugin DTO for a specific plugin ID.
   * @param id - The plugin's unique identifier.
   */
  async getPluginDtoById(id: string): Promise<PluginDTO> {
    const plugin = this.plugins.get(id)
    if (!plugin) {
      throw new Error(`Plugin with ID ${id} not found`)
    }

    return await this.pluginInternalToDto(plugin)
  }

  /**
   * Gets the plugin class constructor for a specific plugin ID.
   * @param id - The plugin's unique identifier.
   * @throws Error if not found or not loaded.
   */
  getPluginClassById(id: string): PluginConstructor {
    const plugin = this.plugins.get(id)
    if (!plugin) {
      throw new Error(`Plugin with ID ${id} not found`)
    }
    if (!plugin.pluginClass) {
      throw new Error(`Plugin with ID ${id} is not loaded`)
    }
    return plugin.pluginClass
  }

  /**
   * Instantiates a plugin by its ID and type, ensuring type compatibility.
   * @param id - The plugin's unique identifier.
   * @param cls - The expected plugin class.
   * @throws Error if not found or not of the expected type.
   */
  getPluginInstanceByIdAndType<T extends PluginBase>(
    id: string,
    cls: new (...args: unknown[]) => T
  ): T {
    const pluginClass = this.getPluginClassById(id)
    if (!(pluginClass.prototype instanceof cls)) {
      throw new Error(`Plugin with ID ${id} is not of type ${cls.name}`)
    }
    return new pluginClass() as T
  }

  /**
   * Constructs the canonical unique ID for a plugin, based on publisher and id.
   * @param metadata - The plugin metadata.
   * @returns The full unique ID string.
   */
  getPluginFinalId(metadata: PluginMetadata): string {
    return `${metadata.publisher.id}.${metadata.id}`
  }

  /**
   * Gets the directory name for a plugin by its ID.
   * @param id - The plugin's unique identifier.
   */
  getPluginDirNameById(id: string): string {
    const plugin = this.plugins.get(id)
    if (!plugin) {
      throw new Error(`Plugin with ID ${id} not found`)
    }
    return plugin.dirName
  }

  /**
   * Gets the properties instance for a plugin by its ID.
   * @param id - The plugin's unique identifier.
   * @returns The plugin properties instance, or a default if none found.
   */
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

  /**
   * Gets the namespace for a plugin based on its metadata.
   * @param metadata - The plugin's metadata.
   */
  getPluginNamespace(metadata: PluginMetadata): string {
    return `${metadata.publisher.id}-${metadata.id}`
  }
}

const pluginManager = new PluginManager()
export default pluginManager
