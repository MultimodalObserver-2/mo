import {
  Workspace,
  WorkspaceBody,
  WorkspaceFooter,
  WorkspaceHeader
} from "@renderer/core/components/app-shell"
import CaptureButton from "@renderer/modules/capture/components/capture-actions/CaptureActions"
import CaptureHeader from "@renderer/modules/capture/components/capture-header/CaptureHeader"
import PreviewDock from "@renderer/modules/visualization/components/preview-dock-wrapper/PreviewDock"

export default function Home() {
  return (
    <Workspace>
      <WorkspaceHeader>
        <CaptureHeader />
      </WorkspaceHeader>
      <WorkspaceBody>
        <PreviewDock />
      </WorkspaceBody>
      <WorkspaceFooter>
        <CaptureButton />
      </WorkspaceFooter>
    </Workspace>
  )
}
