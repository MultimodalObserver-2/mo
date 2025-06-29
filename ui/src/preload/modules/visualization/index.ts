import { contextBridge, ipcRenderer } from "electron"

const visualization = {
  reloadPlaybackConfigs: () => {
    ipcRenderer.send("vis:reload-playback-configs")
  },
  onReloadPlaybackConfigs: (callback: () => void) => {
    const listener = () => {
      callback()
    }
    ipcRenderer.on("vis:on-reload-playback-configs", listener)
    return () => {
      ipcRenderer.removeListener("vis:on-reload-playback-configs", listener)
    }
  },
  updatePanelParameters: (params: unknown) => {
    ipcRenderer.send("vis:update-panel-parameters", params)
  },
  onUpdatePanelParameters: (callback: (params: unknown) => void) => {
    const listener = (_event: Electron.IpcRendererEvent, params: unknown) => {
      callback(params)
    }
    ipcRenderer.on("vis:on-update-panel-parameters", listener)
    return () => {
      ipcRenderer.removeListener("vis:on-update-panel-parameters", listener)
    }
  },
  playback: {
    play: (fromTimeMs: number) => {
      ipcRenderer.send("vis:playback:play", fromTimeMs)
    },
    onPlay: (callback: (fromTimeMs: number) => void) => {
      const listener = (_event: Electron.IpcRendererEvent, fromTimeMs: number) => {
        callback(fromTimeMs)
      }
      ipcRenderer.on("vis:playback:on-play", listener)
      return () => {
        ipcRenderer.removeListener("vis:playback:on-play", listener)
      }
    },
    pause: () => {
      ipcRenderer.send("vis:playback:pause")
    },
    onPause: (callback: () => void) => {
      const listener = () => {
        callback()
      }
      ipcRenderer.on("vis:playback:on-pause", listener)
      return () => {
        ipcRenderer.removeListener("vis:playback:on-pause", listener)
      }
    },
    seek: (toTimeMs: number) => {
      ipcRenderer.send("vis:playback:seek", toTimeMs)
    },
    onSeek: (callback: (toTimeMs: number) => void) => {
      const listener = (_event: Electron.IpcRendererEvent, toTimeMs: number) => {
        callback(toTimeMs)
      }
      ipcRenderer.on("vis:playback:on-seek", listener)
      return () => {
        ipcRenderer.removeListener("vis:playback:on-seek", listener)
      }
    },
    sync: (currentTimeMs: number) => {
      ipcRenderer.send("vis:playback:sync", currentTimeMs)
    },
    onSync: (callback: (currentTimeMs: number) => void) => {
      const listener = (_event: Electron.IpcRendererEvent, currentTimeMs: number) => {
        callback(currentTimeMs)
      }
      ipcRenderer.on("vis:playback:on-sync", listener)
      return () => {
        ipcRenderer.removeListener("vis:playback:on-sync", listener)
      }
    }
  }
}

contextBridge.exposeInMainWorld("visualization", visualization)
