import { ElectronAPI } from "@electron-toolkit/preload"

declare global {
  interface Window {
    electron: ElectronAPI
    core: {
      openModalWindow: (options: Electron.BrowserWindowConstructorOptions, endpoint: string) => void
      dialog: {
        showErrorBox: (title: string, content: string) => void
        showMessageBox: (options: MessageBoxOptions) => Promise<MessageBoxReturnValue>
      }
      clipboard: {
        writeText: (text: string) => void
      }
      shell: {
        openPath: (path: string) => void
      }
    }
    organization: {
      reloadProjects: () => void
      onReloadProjects: (callback: () => void) => void
    }
  }
}
