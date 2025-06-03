import { contextBridge, ipcRenderer } from "electron"

const capture = {
  reloadSettings: () => {
    ipcRenderer.send("capture:reload-settings")
  },
  onReloadSettings: (callback: () => void) => {
    ipcRenderer.on("capture:on-reload-settings", () => callback())
  },
  removeReloadSettingsListeners: () => {
    ipcRenderer.removeAllListeners("capture:on-reload-settings")
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
