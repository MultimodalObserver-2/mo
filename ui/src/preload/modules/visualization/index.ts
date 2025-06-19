import { contextBridge, ipcRenderer } from "electron"

const visualization = {
  reloadPlaybackConfigs: () => {
    ipcRenderer.send("vis:reload-playback-configs")
  },
  onReloadPlaybackConfigs: (callback: () => void) => {
    ipcRenderer.on("vis:on-reload-playback-configs", () => callback())
  },
  removeReloadPlaybackConfigsListeners: () => {
    ipcRenderer.removeAllListeners("vis:on-reload-playback-configs")
  }
}

contextBridge.exposeInMainWorld("visualization", visualization)
