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
    const listener = () => {
      callback()
    }
    ipcRenderer.on("capture:on-reload-sessions", listener)
    return () => {
      ipcRenderer.removeListener("capture:on-reload-sessions", listener)
    }
  },
  reloadCaptureStatus: (status) => {
    ipcRenderer.send("capture:reload-status", status)
  },
  onReloadCaptureStatus: (callback: () => void) => {
    const listener = () => {
      callback()
    }
    ipcRenderer.on("capture:on-reload-status", listener)
    return () => {
      ipcRenderer.removeListener("capture:on-reload-status", listener)
    }
  },
  onChangeCaptureStatusTray: (
    callback: (status: { isCapturing: boolean; isPaused: boolean; isLoading: boolean }) => void
  ) => {
    const listener = (_, status) => {
      callback(status)
    }
    ipcRenderer.on("capture:on-change-status", listener)
    return () => {
      ipcRenderer.removeListener("capture:on-change-status", listener)
    }
  }
}

contextBridge.exposeInMainWorld("capture", capture)
