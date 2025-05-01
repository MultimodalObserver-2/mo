import { contextBridge, ipcRenderer, MessageBoxOptions } from "electron"

const core = {
  openModalWindow: (
    options: Electron.BrowserWindowConstructorOptions,
    endpoint: string,
    parent?: string,
    child?: string
  ) => {
    ipcRenderer.send("core:open-modal-window", {
      options,
      endpoint,
      parent,
      child
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
  },
  clipboard: {
    writeText: (text: string) => {
      return ipcRenderer.send("core:clipboard:write-text", text)
    }
  },
  shell: {
    openPath: (path: string) => {
      return ipcRenderer.send("core:shell:open-path", path)
    }
  },
  prod: {
    getApiPort: () => {
      return ipcRenderer.invoke("core:get-api-port")
    }
  }
}

contextBridge.exposeInMainWorld("core", core)
