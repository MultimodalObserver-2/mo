import "./core/assets/main.css"

import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import { BrowserRouter, Route, Routes } from "react-router"
import MainLayout from "./core/layouts/MainLayout"
import Home from "./core/pages/home/Home"
import CreateProjectPage from "./modules/organization/pages/create-project/CreateProjectPage"
import UpdateProjectPage from "./modules/organization/pages/update-project/UpdateProjectPage"
import ProjectPage from "./modules/organization/pages/project/ProjectPage"
import { Provider } from "react-redux"
import store from "./core/store/store"
import AddParticipantPage from "./modules/organization/pages/add-participant/AddParticipantPage"
import UpdateParticipantPage from "./modules/organization/pages/update-participant/UpdateParticipantPage"
import ParticipantPage from "./modules/organization/pages/participant/ParticipantPage"

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <Provider store={store}>
      <BrowserRouter>
        <Routes>
          <Route element={<MainLayout />}>
            <Route index path="/" element={<Home />} />
            <Route path="/plugins" element={<div>Plugins</div>} />
            <Route path="/settings" element={<div>Settings</div>} />
          </Route>
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
        </Routes>
      </BrowserRouter>
    </Provider>
  </StrictMode>
)
