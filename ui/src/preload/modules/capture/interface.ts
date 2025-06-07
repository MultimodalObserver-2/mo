export default interface CaptureAPI {
  reloadConfigs: () => void
  onReloadConfigs: (callback: () => void) => void
  removeReloadConfigsListeners: () => void
  reloadSessions: () => void
  onReloadSessions: (callback: () => void) => void
  removeReloadSessionsListeners: () => void
  reloadCaptureStatus: () => void
  onReloadCaptureStatus: (callback: () => void) => void
  removeReloadCaptureStatusListeners: () => void
}
