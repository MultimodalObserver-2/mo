import { ElectronAPI } from "@electron-toolkit/preload"

declare global {
  interface Window {
    electron: ElectronAPI
    core: {
      openModalWindow: (
        options: Electron.BrowserWindowConstructorOptions,
        endpoint: string,
        parent?: string,
        name?: string
      ) => void
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
      addActivity: (activity) => void
      onAddActivity: (callback: (activity) => void) => void
      removeAddActivity: () => void
      updateActivity: (originalName, activity) => void
      onUpdateActivity: (callback: (originalName, activity) => void) => void
      removeUpdateActivity: () => void
      reloadProtocols: () => void
      onReloadProtocols: (callback: () => void) => void
      removeReloadProtocols: () => void
      changeSelectedProtocol: (protocol) => void
      onChangeSelectedProtocol: (callback: (protocol) => void) => void
      execProtocol: (projectName: string, protocolName: string) => void
      onExecProtocolFinished: (callback: () => void) => void
      removeExecProtocolFinished: () => void
      activityMessageButtonClicked: (idx) => void
      setActivityMessageHeight: (height) => void
      onActivityTimerChange: (callback: (seconds: number) => void) => void
      onActivityTimerStart: (callback: (initialSeconds) => void) => void
      onActivityTimerStop: (callback: () => void) => void
    }
  }
}
