import {
  Workspace,
  WorkspaceBody,
  WorkspaceFooter,
  WorkspaceHeader
} from "@renderer/core/components/app-shell"
import CaptureButton from "@renderer/modules/capture/components/capture-actions/CaptureActions"
import CaptureHeader from "@renderer/modules/capture/components/capture-header/CaptureHeader"
import PlaybackDock from "@renderer/modules/visualization/components/playback-dock/PlaybackDock"

export default function Home() {
  return (
    <Workspace>
      <WorkspaceHeader>
        <CaptureHeader />
      </WorkspaceHeader>
      <WorkspaceBody>
        <PlaybackDock />
      </WorkspaceBody>
      <WorkspaceFooter>
        <CaptureButton />
      </WorkspaceFooter>
    </Workspace>
  )
}
