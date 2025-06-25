import "./core/assets/main.css"

import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import { HashRouter, Route, Routes } from "react-router"
import SideBarLayout from "./core/layouts/SideBarLayout"
import Home from "./core/pages/home/Home"
import { Provider } from "react-redux"
import store from "./store"
import LoadingPage from "./core/pages/loading/Loading"
import PluginsPage from "./core/pages/plugins/Plugins"
import PluginDetails from "./core/pages/plugins/plugin-details/PluginDetails"
import ErrorPage from "./core/pages/error/Error"
import pluginManager from "./core/plugin/PluginManager"
import AppLayout from "./core/layouts/AppLayout"
import { OrganizationRoutes } from "./modules/organization/routes"
import { CaptureRoutes } from "./modules/capture/routes"
import { VisualizationRoutes } from "./modules/visualization/routes"
import { registerAll } from "./registrations"

registerAll()
pluginManager.loadAllPlugins()

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <Provider store={store}>
      <HashRouter>
        <Routes>
          <Route element={<SideBarLayout />}>
            <Route path="/plugins" element={<PluginsPage />} />
            <Route
              path="/settings"
              element={<div style={{ color: "black" }}>Settings Not Implemented Yet</div>}
            />
          </Route>
          <Route element={<AppLayout />}>
            <Route path="/" element={<Home />} />
          </Route>
          <Route path="/error" element={<ErrorPage />} />
          <Route path="/loading" element={<LoadingPage />} />
          <Route path="/plugins/:pluginTarget/:pluginId" element={<PluginDetails />} />
          <Route path="/organization/*">{OrganizationRoutes}</Route>
          <Route path="/capture/*">{CaptureRoutes}</Route>
          <Route path="/visualization/*">{VisualizationRoutes}</Route>
        </Routes>
      </HashRouter>
    </Provider>
  </StrictMode>
)
