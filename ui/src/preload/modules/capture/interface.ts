export default interface CaptureAPI {
  reloadSettings: () => void
  onReloadSettings: (callback: () => void) => void
  removeReloadSettingsListeners: () => void
  reloadSessions: () => void
  onReloadSessions: (callback: () => void) => void
  removeReloadSessionsListeners: () => void
  reloadCaptureStatus: () => void
  onReloadCaptureStatus: (callback: () => void) => void
  removeReloadCaptureStatusListeners: () => void
}
