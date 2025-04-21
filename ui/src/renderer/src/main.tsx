import "./core/assets/main.css"

import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import { BrowserRouter, Route, Routes } from "react-router"
import MainLayout from "./core/layouts/MainLayout"
import Home from "./core/pages/home/Home"
import CreateProjectPage from "./modules/organization/pages/create-project/CreateProjectPage"
import UpdateProjectPage from "./modules/organization/pages/update-project/UpdateProjectPage"

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        <Route element={<MainLayout />}>
          <Route index path="/" element={<Home />} />
          <Route path="/plugins" element={<div>Plugins</div>} />
          <Route path="/settings" element={<div>Settings</div>} />
        </Route>
        <Route path="/organization/create-project" element={<CreateProjectPage />} />
        <Route path="/organization/update-project/:projectName" element={<UpdateProjectPage />} />
      </Routes>
    </BrowserRouter>
  </StrictMode>
)
