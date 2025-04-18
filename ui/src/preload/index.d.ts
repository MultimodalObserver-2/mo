import { ElectronAPI } from "@electron-toolkit/preload"

declare global {
  interface Window {
    electron: ElectronAPI
    core: {
      openModalWindow: (options: Electron.BrowserWindowConstructorOptions, endpoint: string) => void
    }
  }
}
