import SmartDisplayIcon from "@renderer/core/components/icons/SmartDisplayIcon"
import { CaptureSession } from "@renderer/modules/capture/types/Session"
import { Participant } from "@renderer/modules/organization/types/Participant"
import { Project } from "@renderer/modules/organization/types/Project"
import { openStartPlaybackModal } from "../../utils/modalWindows"

const sessionPlaybackAction = {
  id: "playback",
  element: SmartDisplayIcon,
  onClick: (project: Project, participant: Participant, session: CaptureSession) => {
    openStartPlaybackModal(project.name, participant.code, session.session_id)
  }
}

export default sessionPlaybackAction
