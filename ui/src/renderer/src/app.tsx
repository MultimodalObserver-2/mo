/**
 * @fileoverview
 * Defines the root application router for the renderer process.
 *
 * This component configures all top-level routes for the app, composing
 * each module’s route definitions and wrapping them in shared layouts.
 *
 * - SideBarLayout: Main layout for sidebar-based navigation routes.
 * - AppLayout: Main app content area, includes the sidebar and a bottom panel.
 * - Module routes (organization, capture, visualization) are included via their own route trees.
 *
 * All new module routes should be added here via the corresponding `ModuleRoutes` import.
 */

import SideBarLayout from "./core/layouts/SideBarLayout"
import Home from "./core/pages/home/Home"
import LoadingPage from "./core/pages/loading/Loading"
import PluginsPage from "./core/pages/plugins/Plugins"
import PluginDetails from "./core/pages/plugins/plugin-details/PluginDetails"
import ErrorPage from "./core/pages/error/Error"
import AppLayout from "./core/layouts/AppLayout"
import { OrganizationRoutes } from "./modules/organization/routes"
import { CaptureRoutes } from "./modules/capture/routes"
import { AppLayoutVisualizationRoutes, VisualizationRoutes } from "./modules/visualization/routes"
import { NavigateOptions, Route, Routes, useNavigate } from "react-router"
import { useEffect } from "react"
import SettingsPage from "./core/pages/settings/Settings"

export default function App() {
  const navigate = useNavigate()

  useEffect(() => {
    const unsubscribe = window.core.router.onNavigate((path: string, options?: NavigateOptions) => {
      navigate(path, options)
    })
    return () => {
      unsubscribe()
    }
  }, [navigate])

  return (
    <Routes>
      <Route element={<SideBarLayout />}>
        <Route path="/plugins" element={<PluginsPage />} />
        <Route path="/settings" element={<SettingsPage />} />
      </Route>
      <Route element={<AppLayout />}>
        <Route path="/" element={<Home />} />
        <Route path="/visualization/*">{AppLayoutVisualizationRoutes}</Route>
      </Route>
      <Route path="/error" element={<ErrorPage />} />
      <Route path="/loading" element={<LoadingPage />} />
      <Route path="/plugins/:pluginTarget/:pluginId" element={<PluginDetails />} />
      <Route path="/organization/*">{OrganizationRoutes}</Route>
      <Route path="/capture/*">{CaptureRoutes}</Route>
      <Route path="/visualization/*">{VisualizationRoutes}</Route>
    </Routes>
  )
}
