/**
 * @module modalWindows
 * This file contains utility functions for opening various modal windows
 * throughout the application by abstracting the `window.core.openModalWindow` API.
 */

import i18n from "i18next"

const t = i18n.getFixedT(null, "core", "modals")

export function openPluginDetailsModal(
  pluginId: string,
  pluginTarget: "api" | "ui",
  pluginDir?: string
) {
  window.core.openModalWindow({
    options: {
      width: 800,
      height: 650,
      minWidth: 800,
      minHeight: 650,
      title: t("plugin_details"),
      webPreferences: {
        webSecurity: false,
        allowRunningInsecureContent: true
      }
    },
    endpoint: `plugins/${pluginTarget}/${pluginId}?dir=${pluginDir ?? ""}`
  })
}
