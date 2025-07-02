/**
 * @module core/plugin/constants
 * @description
 * Defines the base path where all plugins for the application are located.
 * This path is resolved at runtime using the Electron core API.
 */

export const PLUGIN_BASE_PATH = await window.core.app.paths.plugins()
