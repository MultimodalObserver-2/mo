import { PluginBase } from "@renderer/core/plugin/types"
import { JSX, ReactElement } from "react"

export type PauseInterval = [number, number]

export interface PlaybackContext {
  filePath: string // Path to the file being visualized
  captureStartTimestamp: number // First timestamp of the capture
  fileCaptureStartTimestamp: number // Timestamp of the first frame in the file
  pauseIntervals: PauseInterval[] // Intervals during which the visualization is paused
}

export interface PlaybackControls {
  onPlay: (callback: (fromTimeMs: number) => void) => () => void
  onPause: (callback: () => void) => () => void
  onSeek: (callback: (toTimeMs: number) => void) => () => void
  onSync: (callback: (currentTimeMs: number) => void) => () => void
}

export interface PluginViewProps {
  controls: PlaybackControls
  context: PlaybackContext
  settings: Record<string, unknown>
}

export abstract class PlaybackPlugin extends PluginBase {
  protected context!: PlaybackContext
  static readonly __module: string = "playback"

  abstract getView(props: PluginViewProps): JSX.Element | ReactElement
  abstract getPreview(): JSX.Element | ReactElement
}
