import { MessageBoxOptions, MessageBoxReturnValue, OpenDialogReturnValue } from "electron"

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
}
