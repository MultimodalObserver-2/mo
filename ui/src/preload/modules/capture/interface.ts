export default interface CaptureAPI {
  reloadSettings: () => void
  onReloadSettings: (callback: () => void) => void
  removeReloadSettings: () => void
}
