import { contextBridge, ipcRenderer } from "electron"

const capture = {
  reloadConfigs: () => {
    ipcRenderer.send("capture:reload-configs")
  },
  onReloadConfigs: (callback: () => void) => {
    const listener = () => {
      callback()
    }
    ipcRenderer.on("capture:on-reload-configs", listener)
    return () => {
      ipcRenderer.removeListener("capture:on-reload-configs", listener)
    }
  },
  reloadSessions: () => {
    ipcRenderer.send("capture:reload-sessions")
  },
  onReloadSessions: (callback: () => void) => {
    ipcRenderer.on("capture:on-reload-sessions", () => callback())
  },
  removeReloadSessionsListeners: () => {
    ipcRenderer.removeAllListeners("capture:on-reload-sessions")
  },
  reloadCaptureStatus: () => {
    ipcRenderer.send("capture:reload-status")
  },
  onReloadCaptureStatus: (callback: () => void) => {
    ipcRenderer.on("capture:on-reload-status", () => callback())
  },
  removeReloadCaptureStatusListeners: () => {
    ipcRenderer.removeAllListeners("capture:on-reload-status")
  }
}

contextBridge.exposeInMainWorld("capture", capture)
