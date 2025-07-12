import { contextBridge, ipcRenderer, MessageBoxOptions } from "electron"
import { NavigateOptions } from "react-router"

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
      },
      locales: () => {
        return ipcRenderer.invoke("core:app:paths:locales")
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
    },
    extname: (filePath: string) => {
      return ipcRenderer.invoke("core:path:extname", filePath)
    }
  },
  router: {
    navigate: (path: string, options?: NavigateOptions) => {
      ipcRenderer.send("core:router:navigate", path, options)
    },
    onNavigate: (callback: (path: string, options?: NavigateOptions) => void) => {
      const listener = (
        _event: Electron.IpcRendererEvent,
        path: string,
        options?: NavigateOptions
      ) => callback(path, options)
      ipcRenderer.on("core:router:on-navigate", listener)
      return () => {
        ipcRenderer.removeListener("core:router:on-navigate", listener)
      }
    }
  },
  preferences: {
    get: (key: string) => {
      return ipcRenderer.invoke("core:preferences:get", key)
    },
    set: (key: string, value: unknown) => {
      ipcRenderer.invoke("core:preferences:set", key, value)
    },
    remove: (key: string) => {
      ipcRenderer.invoke("core:preferences:remove", key)
    },
    getAll: () => {
      return ipcRenderer.invoke("core:preferences:getAll")
    },
    reset: () => {
      ipcRenderer.invoke("core:preferences:reset")
    },
    has: (key: string) => {
      return ipcRenderer.invoke("core:preferences:has", key)
    },
    extend: (key: string, partialValue: Record<string, unknown>) => {
      ipcRenderer.invoke("core:preferences:extend", key, partialValue)
    }
  },
  hotkeys: {
    getAll: () => {
      return ipcRenderer.invoke("core:hotkeys:getAll")
    },
    get: (actionId: string) => {
      return ipcRenderer.invoke("core:hotkeys:get", actionId)
    },
    set: (actionId: string, keyCombination: string) => {
      return ipcRenderer.invoke("core:hotkeys:set", actionId, keyCombination)
    },
    reset: (actionId: string) => {
      return ipcRenderer.invoke("core:hotkeys:reset", actionId)
    },
    disable: () => {
      return ipcRenderer.invoke("core:hotkeys:disable")
    },
    enable: () => {
      return ipcRenderer.invoke("core:hotkeys:enable")
    }
  },
  options: {
    get: (key: string) => {
      return ipcRenderer.invoke("core:options:get", key)
    },
    set: (key: string, value: boolean) => {
      return ipcRenderer.invoke("core:options:set", key, value)
    },
    getAll: () => {
      return ipcRenderer.invoke("core:options:getAll")
    }
  },
  i18n: {
    getInitialData: () => {
      return ipcRenderer.invoke("core:i18n:getInitialData")
    },
    changeLanguage: (language: string) => {
      return ipcRenderer.invoke("core:i18n:changeLanguage", language)
    },
    loadResource: (
      basePath: string,
      localesPath: string,
      language: string,
      namespace: string,
      name: string = "translation.json"
    ) => {
      return ipcRenderer.invoke(
        "core:i18n:loadResource",
        basePath,
        localesPath,
        language,
        namespace,
        name
      )
    }
  }
}

contextBridge.exposeInMainWorld("core", core)
