import { MessageBoxOptions, MessageBoxReturnValue, OpenDialogReturnValue } from "electron"
import { NavigateOptions } from "react-router"

export default interface CoreAPI {
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
  }) => void
  dialog: {
    showErrorBox: (title: string, content: string) => void
    showMessageBox: (options: MessageBoxOptions) => Promise<MessageBoxReturnValue>
    showOpenDialog: (options: Electron.OpenDialogOptions) => Promise<OpenDialogReturnValue>
  }
  clipboard: {
    writeText: (text: string) => void
  }
  shell: {
    openPath: (path: string) => void
  }
  prod: {
    getApiPort: () => Promise<number>
  }
  plugins: {
    reloadPlugins: () => void
    onReloadPlugins: (callback: () => void) => void
    removeReloadPlugins: () => void
  }
  app: {
    paths: {
      plugins: () => Promise<string>
    }
  }
  zip: {
    extract: (
      buffer: ArrayBuffer,
      destPath: string
    ) => Promise<{ success: boolean; error?: string }>
  }
  fs: {
    readFileSync: (filePath: string, encoding?: string) => Promise<Buffer | string>
    writeFileSync: (filePath: string, content: string) => Promise<void>
    readdirSync: (dirPath: string) => Promise<string[]>
    existsSync: (filePath: string) => Promise<boolean>
    rmSync: (filePath: string, options?: { recursive?: boolean; force?: boolean }) => Promise<void>
    isDirectory: (filePath: string) => Promise<boolean>
  }
  path: {
    join: (...paths: string[]) => Promise<string>
    basename: (filePath: string) => Promise<string>
    extname: (filePath: string) => Promise<string>
  }
  router: {
    navigate: (path: string, options?: NavigateOptions) => void
    onNavigate: (callback: (path: string, options?: NavigateOptions) => void) => () => void
  }
}
