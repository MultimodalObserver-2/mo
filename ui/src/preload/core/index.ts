import { contextBridge, ipcRenderer } from "electron"

const core = {
  openModalWindow: (options: Electron.BrowserWindowConstructorOptions, endpoint: string) => {
    ipcRenderer.send("core:open-modal-window", {
      options,
      endpoint
    })
  }
}

contextBridge.exposeInMainWorld("core", core)
