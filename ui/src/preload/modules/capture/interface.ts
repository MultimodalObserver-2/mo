export default interface CaptureAPI {
  reloadConfigs: () => void
  onReloadConfigs: (callback: () => void) => () => void
  reloadSessions: () => void
  onReloadSessions: (callback: () => void) => void
  removeReloadSessionsListeners: () => void
  reloadCaptureStatus: (status: { isCapturing: boolean; isPaused: boolean }) => void
  onReloadCaptureStatus: (callback: () => void) => () => void
  onChangeCaptureStatusTray: (
    callback: (status: { isCapturing: boolean; isPaused: boolean }) => void
  ) => () => void
}
