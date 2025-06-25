import { Route } from "react-router"
import CreateProjectPage from "./pages/project-pages/create-project/CreateProjectPage"
import UpdateProjectPage from "./pages/project-pages/update-project/UpdateProjectPage"
import ProjectPage from "./pages/project-pages/project/ProjectPage"
import AddParticipantPage from "./pages/participant-pages/add-participant/AddParticipantPage"
import UpdateParticipantPage from "./pages/participant-pages/update-participant/UpdateParticipantPage"
import ParticipantPage from "./pages/participant-pages/participant/ParticipantPage"
import AddProtocolPage from "./pages/protocol-pages/add-protocol/AddProtocolPage"
import AddActivity from "./pages/protocol-pages/add-activity/AddActivity"
import EditActivity from "./pages/protocol-pages/edit-activity/EditActivity"
import UpdateProtocolPage from "./pages/protocol-pages/update-protocol/UpdateProtocolPage"
import ProtocolPage from "./pages/protocol-pages/protocol/ProtocolPage"
import ActivityMessagePage from "./pages/protocol-pages/activity-message/ActivityMessagePage"
import ActivityTimerPage from "./pages/protocol-pages/activity-timer/ActivityTimerPage"

export const OrganizationRoutes = (
  <>
    <Route path="create-project" element={<CreateProjectPage />} />
    <Route path="update-project/:projectName" element={<UpdateProjectPage />} />
    <Route path="projects/:projectName" element={<ProjectPage />} />
    <Route path=":projectName/add-participant" element={<AddParticipantPage />} />
    <Route
      path=":projectName/update-participant/:participantCode"
      element={<UpdateParticipantPage />}
    />
    <Route path=":projectName/participants/:participantCode" element={<ParticipantPage />} />
    <Route path=":projectName/add-protocol" element={<AddProtocolPage />} />
    <Route path="add-activity" element={<AddActivity />} />
    <Route path="edit-activity" element={<EditActivity />} />
    <Route path=":projectName/update-protocol/:protocolName" element={<UpdateProtocolPage />} />
    <Route path=":projectName/protocols/:protocolName" element={<ProtocolPage />} />
    <Route path="activity-message/:activityName" element={<ActivityMessagePage />} />
    <Route path="activity-timer" element={<ActivityTimerPage />} />
  </>
)
