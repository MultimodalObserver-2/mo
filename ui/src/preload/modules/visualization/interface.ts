export default interface VisualizationAPI {
  reloadPlaybackConfigs: () => void
  onReloadPlaybackConfigs: (callback: () => void) => void
  removeReloadPlaybackConfigsListeners: () => void
}
