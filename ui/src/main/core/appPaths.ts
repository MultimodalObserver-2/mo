import { is } from "@electron-toolkit/utils"
import { app, ipcMain } from "electron"
import path from "path"

export function getPluginBasePath(): string {
  return is.dev
    ? path.resolve(process.cwd(), "src/renderer/src/plugins-dev")
    : path.resolve(app.getPath("userData"), "multimodal-observer", "plugins", "ui")
}

app.whenReady().then(() => {
  ipcMain.handle("core:app:paths:plugins", () => {
    return getPluginBasePath()
  })
})
