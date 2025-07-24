/**
 * @module core/plugin/constants
 * @description
 * Defines the base path where all plugins for the application are located.
 * This path is resolved at runtime using the Electron core API.
 */

let PLUGIN_BASE_PATH: string | undefined

if (typeof window !== "undefined" && window.core?.app?.paths?.plugins) {
  PLUGIN_BASE_PATH = await window.core.app.paths.plugins()
} else {
  PLUGIN_BASE_PATH = "./plugins"
}

export { PLUGIN_BASE_PATH }
