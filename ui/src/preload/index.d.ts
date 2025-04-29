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
      prod: {
        getApiPort: () => Promise<number>
      }
    }
    organization: {
      reloadProjects: () => void
      onReloadProjects: (callback: () => void) => void
      reloadParticipants: () => void
      onReloadParticipants: (callback: () => void) => void
      removeReloadParticipants: () => void
      changeSelectedProject: (project) => void
      onChangeSelectedProject: (callback: (project) => void) => void
      changeSelectedParticipant: (participant) => void
      onChangeSelectedParticipant: (callback: (participant) => void) => void
    }
  }
}
