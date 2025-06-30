import playbackService from "../../services/PlaybackService"
import { PlaybackConfig } from "../../types/PlaybackConfig"

interface PreviewPanelProps {
  params: PlaybackConfig
}

export default function PreviewPanel({ params }: Readonly<PreviewPanelProps>) {
  if (!params.plugin_is_loaded) {
    return (
      <p>
        The plugin with id <strong>{params.plugin_id}</strong> is not loaded or does not exist.
        Please ensure the plugin is installed and loaded correctly.
      </p>
    )
  }
  const plugin = playbackService.getPluginInstanceById(params.plugin_id)
  plugin.configure(params.settings)
  return plugin.getPreview()
}
