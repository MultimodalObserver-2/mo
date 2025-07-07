import { PlaybackConfig } from "../../types/PlaybackConfig"
import { CaptureSession } from "@renderer/modules/capture/types/Session"
import playbackService from "../../services/PlaybackService"
import { PlaybackContext } from "../../plugin/PlaybackPlugin"
import PanelError from "../../components/panel-error/PanelError"

interface PlaybackPanelProps {
  params: PlaybackConfig
}

export function getPlaybackPanel(session: CaptureSession) {
  const controls = {
    onPlay: window.visualization.playback.onPlay,
    onPause: window.visualization.playback.onPause,
    onSeek: window.visualization.playback.onSeek,
    onSync: window.visualization.playback.onSync
  }

  const PlaybackPanel = ({ params }: Readonly<PlaybackPanelProps>) => {
    if (!params.plugin_is_loaded) {
      return <PanelError pluginId={params.plugin_id} />
    }

    try {
      const plugin = playbackService.getPluginInstanceById(params.plugin_id)
      plugin.configure(params.settings)
      const captureConfig = session.capture_sources.find(
        (source) => source.config_id === params.capture_config_id
      )

      const context: PlaybackContext = {
        filePath: captureConfig?.location ?? "",
        captureStartTimestamp: session?.start_timestamp ?? 0,
        fileCaptureStartTimestamp: captureConfig?.start_timestamp ?? 0,
        pauseIntervals: session?.paused_intervals ?? []
      }

      return (
        plugin.getView({ controls, context, settings: params.settings }) ?? (
          <div>No view available</div>
        )
      )
    } catch {
      return <PanelError pluginId={params.plugin_id} />
    }
  }

  return PlaybackPanel
}
