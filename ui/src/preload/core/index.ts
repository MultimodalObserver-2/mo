import { contextBridge, ipcRenderer, MessageBoxOptions } from "electron"

const core = {
  openModalWindow: (args: {
    options: Electron.BrowserWindowConstructorOptions
    endpoint: string
    autoAdjustHeight?: {
      elementId: string
      extraHeight?: number
      errorHeight?: number
      setMinimumSize?: boolean
    }
    parent?: string
    name?: string
  }) => {
    ipcRenderer.send("core:open-modal-window", args)
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
  },
  app: {
    paths: {
      plugins: () => {
        return ipcRenderer.invoke("core:app:paths:plugins")
      }
    }
  },
  zip: {
    extract: (
      buffer: ArrayBuffer,
      destPath: string
    ): Promise<{ success: boolean; error?: string }> => {
      return ipcRenderer.invoke("core:zip:extract", buffer, destPath)
    }
  },
  fs: {
    readFileSync: (path: string, encoding?: string) =>
      ipcRenderer.invoke("core:fs:readFileSync", path, encoding),
    writeFileSync: (path: string, content: string) =>
      ipcRenderer.invoke("core:fs:writeFileSync", path, content),
    readdirSync: (path: string) => ipcRenderer.invoke("core:fs:readdirSync", path),
    existsSync: (path: string) => ipcRenderer.invoke("core:fs:existsSync", path),
    rmSync: (path: string, options?: { recursive?: boolean; force?: boolean }) => {
      return ipcRenderer.invoke("core:fs:rmSync", path, options)
    },
    isDirectory: (path: string) => {
      return ipcRenderer.invoke("core:fs:isDirectory", path)
    }
  },
  path: {
    join: (...paths: string[]) => {
      return ipcRenderer.invoke("core:path:join", ...paths)
    },
    basename: (filePath: string) => {
      return ipcRenderer.invoke("core:path:basename", filePath)
    }
  }
}

contextBridge.exposeInMainWorld("core", core)
