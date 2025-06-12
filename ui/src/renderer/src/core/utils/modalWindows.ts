/**
 * @module modalWindows
 * This file contains utility functions for opening various modal windows
 * throughout the application by abstracting the `window.core.openModalWindow` API.
 */

export function openPluginDetailsModal(pluginId: string) {
  window.core.openModalWindow({
    options: { width: 800, height: 650, minWidth: 800, minHeight: 650, title: "Plugin Details" },
    endpoint: `plugins/${pluginId}`
  })
}
