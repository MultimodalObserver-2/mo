import playbackService from "../../services/PlaybackService"
import { PlaybackConfig } from "../../types/PlaybackConfig"
import PanelError from "../panel-error/PanelError"

interface PreviewPanelProps {
  params: PlaybackConfig
}

export default function PreviewPanel({ params }: Readonly<PreviewPanelProps>) {
  if (!params.plugin_is_loaded) {
    return <PanelError pluginId={params.plugin_id} />
  }
  try {
    const plugin = playbackService.getPluginInstanceById(params.plugin_id)
    plugin.configure(params.settings)
    return plugin.getPreview()
  } catch {
    return <PanelError pluginId={params.plugin_id} />
  }
}
