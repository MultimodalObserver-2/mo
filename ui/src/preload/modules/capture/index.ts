import { contextBridge, ipcRenderer } from "electron"

const capture = {
  reloadSettings: () => {
    ipcRenderer.send("capture:reload-settings")
  },
  onReloadSettings: (callback: () => void) => {
    ipcRenderer.on("capture:on-reload-settings", () => callback())
  },
  removeReloadSettings: () => {
    ipcRenderer.removeAllListeners("capture:on-reload-settings")
  }
}

contextBridge.exposeInMainWorld("capture", capture)
