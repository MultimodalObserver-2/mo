export default interface VisualizationAPI {
  reloadPlaybackConfigs: () => void
  onReloadPlaybackConfigs: (callback: () => void) => () => void
  updatePanelParameters: (params: unknown) => void
  onUpdatePanelParameters: (callback: (params: unknown) => void) => () => void
  updateConfigVisibility: (configId: string, visible: boolean) => void
  onUpdateConfigVisibility: (callback: (configId: string, visible: boolean) => void) => () => void
  playback: {
    play: (fromTimeMs: number) => void
    onPlay: (callback: (fromTimeMs: number) => void) => () => void
    pause: () => void
    onPause: (callback: () => void) => () => void
    seek: (toTimeMs: number) => void
    onSeek: (callback: (toTimeMs: number) => void) => () => void
    sync: (currentTimeMs: number) => void
    onSync: (callback: (currentTimeMs: number) => void) => () => void
  }
}
