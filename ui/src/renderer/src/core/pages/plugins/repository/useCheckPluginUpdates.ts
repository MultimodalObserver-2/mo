import { useEffect, useRef } from "react"
import { useTranslation } from "react-i18next"
import { useLocation } from "react-router"
import pluginRepositoryService from "@renderer/core/services/PluginRepositoryService"
import pluginService from "@renderer/core/services/PluginService"

/**
 * On mount asks the repository whether any installed plugin has a newer release and shows a
 * single notification. Runs once per session across windows; failures are swallowed on purpose.
 */
export default function useCheckPluginUpdates(): void {
  const { t } = useTranslation("core", { keyPrefix: "pages.pluginRepository" })
  const location = useLocation()
  // Read the *current* route when the async check resolves, not the mount-time one.
  const pathnameRef = useRef(location.pathname)
  pathnameRef.current = location.pathname
  // Guards against a second run (React StrictMode re-invokes effects in development).
  const hasRun = useRef(false)

  useEffect(() => {
    if (hasRun.current) return
    hasRun.current = true

    void (async () => {
      try {
        // Only one window per session runs the check: the main process hands out the claim.
        // Asking before any network work means the losing windows cost nothing.
        if (!(await window.core.plugins.claimUpdateCheck())) return
        await pluginRepositoryService.initialize()
        const installed = await pluginService.getAll()
        const payload = installed.map((p) => ({ slug: p.id, version: p.version }))
        const updatesAvailable = await pluginRepositoryService.checkUpdates(payload)
        if (!updatesAvailable) return
        // Opened straight into a plugin view (deep link): don't interrupt with the modal.
        if (pathnameRef.current.startsWith("/plugins/repository/")) return
        await window.core.dialog.showMessageBox({
          type: "info",
          title: t("updatesAvailableTitle"),
          message: t("updatesAvailableMessage")
        })
      } catch {
        // Informative only — stay silent on error/offline.
      }
    })()
  }, [t])
}
