/**
 * @module core/appPaths
 * @description Provides functions to get application paths for different resources.
 */

import { is } from "@electron-toolkit/utils"
import { app, ipcMain } from "electron"
import path from "path"
import os from "os"
import { resourcesPath } from "process"

function getLocalAppDataFolder() {
  const platform = process.platform
  if (platform === "win32") {
    // Windows: AppData\Local
    return process.env.LOCALAPPDATA || path.join(os.homedir(), "AppData", "Local")
  } else if (platform === "darwin") {
    // macOS: ~/Library/Application Support
    return path.join(os.homedir(), "Library", "Application Support")
  } else {
    // Linux: ~/.local/share
    return path.join(os.homedir(), ".local", "share")
  }
}

export function getMainAppPath(): string {
  return is.dev
    ? path.resolve(process.cwd(), "data")
    : path.resolve(getLocalAppDataFolder(), "multimodal-observer")
}

export function getPreferencesPath(): string {
  return is.dev
    ? path.resolve(getMainAppPath(), "preferences.json")
    : path.resolve(getMainAppPath(), "preferences.json")
}

export function getPluginBasePath(): string {
  return is.dev
    ? path.resolve(process.cwd(), "src/renderer/src/plugins-dev")
    : path.resolve(getLocalAppDataFolder(), "multimodal-observer", "plugins", "ui")
}

export function getResourcesPath(): string {
  return is.dev ? path.resolve(process.cwd(), "resources") : path.resolve(resourcesPath)
}

export function getLocalesPath(): string {
  return path.resolve(getResourcesPath(), "locales")
}

app.whenReady().then(() => {
  ipcMain.handle("core:app:paths:plugins", () => {
    return getPluginBasePath()
  })

  ipcMain.handle("core:app:paths:locales", () => {
    return getLocalesPath()
  })
})
