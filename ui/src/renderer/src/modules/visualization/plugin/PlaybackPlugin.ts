import { PluginBase } from "@renderer/core/plugin/types"
import { ReactElement } from "react"

export type PauseInterval = [number, number]

export interface PlaybackContext {
  filePath: string // Path to the file being visualized
  captureStartTimestamp: number // First timestamp of the capture
  fileCaptureStartTimestamp: number // Timestamp of the first frame in the file
  pauseIntervals: PauseInterval[] // Intervals during which the visualization is paused
}

export abstract class PlaybackPlugin extends PluginBase {
  protected context!: PlaybackContext
  static readonly __module: string = "playback"

  initialize(context: PlaybackContext): void {
    this.context = context
    this.onInitialize(context)
  }

  protected abstract onInitialize(context: PlaybackContext): void

  abstract getView(): ReactElement
  abstract play(fromTimeMs: number): void
  abstract pause(): void
  abstract seek(toTimeMs: number): void
  abstract onTick(currentTimeMs: number): void

  protected getStartOffset(): number {
    return this.context.fileCaptureStartTimestamp - this.context.captureStartTimestamp
  }
}
