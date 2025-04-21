import { contextBridge, ipcRenderer, MessageBoxOptions } from "electron"

const core = {
  openModalWindow: (options: Electron.BrowserWindowConstructorOptions, endpoint: string) => {
    ipcRenderer.send("core:open-modal-window", {
      options,
      endpoint
    })
  },
  dialog: {
    showErrorBox: (title: string, content: string) => {
      ipcRenderer.send("core:show-error-box", {
        title,
        content
      })
    },
    showMessageBox: (options: MessageBoxOptions) => {
      return ipcRenderer.invoke("core:show-message-box", options)
    }
  }
}

contextBridge.exposeInMainWorld("core", core)
