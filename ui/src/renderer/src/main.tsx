import "./core/assets/main.css"

import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import { HashRouter, Route, Routes } from "react-router"
import MainLayout from "./core/layouts/MainLayout"
import Home from "./core/pages/home/Home"
import CreateProjectPage from "./modules/organization/pages/project-pages/create-project/CreateProjectPage"
import UpdateProjectPage from "./modules/organization/pages/project-pages/update-project/UpdateProjectPage"
import ProjectPage from "./modules/organization/pages/project-pages/project/ProjectPage"
import { Provider } from "react-redux"
import store from "./core/store/store"
import AddParticipantPage from "./modules/organization/pages/participant-pages/add-participant/AddParticipantPage"
import UpdateParticipantPage from "./modules/organization/pages/participant-pages/update-participant/UpdateParticipantPage"
import ParticipantPage from "./modules/organization/pages/participant-pages/participant/ParticipantPage"
import LoadingPage from "./core/pages/loading/Loading"
import AddProtocolPage from "./modules/organization/pages/protocol-pages/add-protocol/AddProtocolPage"
import AddActivity from "./modules/organization/pages/protocol-pages/add-activity/AddActivity"
import EditActivity from "./modules/organization/pages/protocol-pages/edit-activity/EditActivity"
import UpdateProtocolPage from "./modules/organization/pages/protocol-pages/update-protocol/UpdateProtocolPage"
import ProtocolPage from "./modules/organization/pages/protocol-pages/protocol/ProtocolPage"
import ActivityMessagePage from "./modules/organization/pages/protocol-pages/activity-message/ActivityMessagePage"
import ActivityTimerPage from "./modules/organization/pages/protocol-pages/activity-timer/ActivityTimerPage"
import PluginsPage from "./core/pages/plugins/Plugins"
import PluginDetails from "./core/pages/plugins/plugin-details/PluginDetails"
import SelectCaptureSource from "./modules/capture/pages/select-capture-source/SelectCaptureSource"
import AddCaptureConfig from "./modules/capture/pages/add-capture-config/AddCaptureConfig"
import UpdateCaptureConfig from "./modules/capture/pages/update-capture-config/UpdateCaptureConfig"
import SessionPage from "./modules/capture/pages/session/Session"
import ErrorPage from "./core/pages/error/Error"

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <Provider store={store}>
      <HashRouter>
        <Routes>
          <Route element={<MainLayout />}>
            <Route index path="/" element={<Home />} />
            <Route path="/plugins" element={<PluginsPage />} />
            <Route
              path="/settings"
              element={<div style={{ color: "black" }}>Settings Not Implemented Yet</div>}
            />
          </Route>
          <Route path="/error" element={<ErrorPage />} />
          <Route path="/loading" element={<LoadingPage />} />
          <Route path="/organization/create-project" element={<CreateProjectPage />} />
          <Route path="/organization/update-project/:projectName" element={<UpdateProjectPage />} />
          <Route path="/organization/projects/:projectName" element={<ProjectPage />} />
          <Route
            path="/organization/:projectName/add-participant"
            element={<AddParticipantPage />}
          />
          <Route
            path="/organization/:projectName/update-participant/:participantCode"
            element={<UpdateParticipantPage />}
          />
          <Route
            path="/organization/:projectName/participants/:participantCode"
            element={<ParticipantPage />}
          />
          <Route path="/organization/:projectName/add-protocol" element={<AddProtocolPage />} />
          <Route path="/organization/add-activity" element={<AddActivity />} />
          <Route path="/organization/edit-activity" element={<EditActivity />} />
          <Route
            path="/organization/:projectName/update-protocol/:protocolName"
            element={<UpdateProtocolPage />}
          />
          <Route
            path="/organization/:projectName/protocols/:protocolName"
            element={<ProtocolPage />}
          />
          <Route
            path="/organization/activity-message/:activityName"
            element={<ActivityMessagePage />}
          />
          <Route path="/organization/activity-timer" element={<ActivityTimerPage />} />
          <Route path="/plugins/:pluginId" element={<PluginDetails />} />
          <Route path="/capture/select-source/:projectName" element={<SelectCaptureSource />} />
          <Route path="/capture/:projectName/sources/:pluginId" element={<AddCaptureConfig />} />
          <Route
            path="/capture/:projectName/configs/:configName"
            element={<UpdateCaptureConfig />}
          />
          <Route
            path="/capture/:projectName/participants/:participantCode/sessions/:sessionId"
            element={<SessionPage />}
          />
        </Routes>
      </HashRouter>
    </Provider>
  </StrictMode>
)
