import { is } from "@electron-toolkit/utils"
import { app, ipcMain } from "electron"
import path from "path"
import os from "os"

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

export function getPluginBasePath(): string {
  return is.dev
    ? path.resolve(process.cwd(), "src/renderer/src/plugins-dev")
    : path.resolve(getLocalAppDataFolder(), "multimodal-observer", "plugins", "ui")
}

app.whenReady().then(() => {
  ipcMain.handle("core:app:paths:plugins", () => {
    return getPluginBasePath()
  })
})
