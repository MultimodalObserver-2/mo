import PlaybackDock from "../playback-dock/PlaybackDock"
import PreviewPanel from "./PreviewPanel"

export default function PreviewDock() {
  return <PlaybackDock playbackPanel={PreviewPanel} />
}
