import { useEffect, useRef } from "react"
import { useTranslation } from "react-i18next"
import { useLocation } from "react-router"
import pluginRepositoryService from "@renderer/core/services/PluginRepositoryService"
import pluginService from "@renderer/core/services/PluginService"

/**
 * On the first mount, asks the repository whether any installed plugin has a newer release
 * and, if so, shows a single generic notification. Meant to run once per app launch from the
 * app root.
 *
 * Deliberately quiet: any failure (offline, endpoint down) is swallowed, since this is
 * informative only and must not interrupt startup. The notification is also suppressed when
 * the app already landed on a repository plugin view (e.g. opened via deep link), so it does
 * not compete with that intent.
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
