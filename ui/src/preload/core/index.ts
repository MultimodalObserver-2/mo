import { contextBridge, ipcRenderer, MessageBoxOptions } from "electron"

const core = {
  openModalWindow: (
    options: Electron.BrowserWindowConstructorOptions,
    endpoint: string,
    parent?: string,
    name?: string
  ) => {
    ipcRenderer.send("core:open-modal-window", {
      options,
      endpoint,
      parent,
      name
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
    },
    showOpenDialog: (options: Electron.OpenDialogOptions) => {
      return ipcRenderer.invoke("core:show-open-dialog", options)
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
  },
  plugins: {
    reloadPlugins: () => {
      ipcRenderer.send("core:reload-plugins")
    },
    onReloadPlugins: (callback: () => void) => {
      ipcRenderer.on("core:on-reload-plugins", () => callback())
    },
    removeReloadPlugins: () => {
      ipcRenderer.removeAllListeners("core:on-reload-plugins")
    }
  }
}

contextBridge.exposeInMainWorld("core", core)
