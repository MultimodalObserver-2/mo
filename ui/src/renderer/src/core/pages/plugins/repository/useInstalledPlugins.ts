import { useEffect, useState } from "react"
import { useTranslation } from "react-i18next"
import pluginRepositoryService, {
  latestRelease
} from "@renderer/core/services/PluginRepositoryService"
import pluginService from "@renderer/core/services/PluginService"
import { Plugin } from "@renderer/core/types/Plugin"
import {
  RepositoryPlugin,
  RepositoryPluginDetail,
  RepositoryRelease
} from "@renderer/core/types/RepositoryPlugin"
import {
  getApiErrorMessage,
  showUnvalidatedPluginMessage
} from "@renderer/core/utils/dialogMessages"
import { isNewerRelease, pluginKey } from "./repositoryHelpers"

type InstallState = "install" | "update" | "installed"

/**
 * Owns the set of installed plugins and the install/update flow. Loads the installed set on
 * mount, exposes the per-plugin derivations the views need (`installStateFor`, `hasUpdate`)
 * and the actions to install/update a specific or the latest release. A single install runs
 * at a time; the install actions take the plugin `detail` so the hook stays decoupled from
 * how the detail is loaded.
 */
export default function useInstalledPlugins() {
  const { t } = useTranslation("core", { keyPrefix: "pages.pluginRepository" })
  const [installedPlugins, setInstalledPlugins] = useState<Map<string, Plugin>>(new Map())
  // Name (version) of the release currently being installed, or null when idle. A single
  // in-flight install at a time: this both flags global busy-ness and marks which button spins.
  const [installingRelease, setInstallingRelease] = useState<string | null>(null)
  const isInstalling = installingRelease !== null

  // Load the set of already-installed plugins (local, independent of the repository client).
  useEffect(() => {
    pluginService
      .getAll()
      .then((installed) => setInstalledPlugins(new Map(installed.map((p) => [p.id, p]))))
      .catch(() => {
        // Leave the installed set empty; the repository list still renders.
      })
  }, [])

  // Installs (or updates to) a specific `release`. `release` need not be the latest: any
  // version other than the installed one can be picked from the releases list.
  const installRelease = async (detail: RepositoryPluginDetail, release: RepositoryRelease) => {
    if (isInstalling) return
    const installed = installedPlugins.get(pluginKey(detail))
    const isUpdate = installed !== undefined
    const title = isUpdate ? t("updateTitle") : t("installTitle")

    // Warn before installing/updating to a release that the repository has not validated.
    if (release.status !== "approved") {
      const acceptId = 0
      const response = await showUnvalidatedPluginMessage(detail.name, acceptId)
      if (response.response !== acceptId) return
    }

    setInstallingRelease(release.name)
    try {
      const plugin = installed
        ? await pluginRepositoryService.updatePlugin(installed, release)
        : await pluginRepositoryService.installPlugin(release)
      setInstalledPlugins((prev) => new Map(prev).set(plugin.id, plugin))
      if (plugin.is_loaded) {
        window.core.dialog.showMessageBox({
          type: "info",
          title,
          message: isUpdate
            ? t("updatedSuccessfully", { name: plugin.name, version: plugin.version })
            : t("installedSuccessfully", { name: plugin.name })
        })
      } else {
        window.core.dialog.showMessageBox({
          type: "warning",
          title,
          message: isUpdate
            ? t("updatedButFailed", { error: plugin.error })
            : t("installedButFailed", { error: plugin.error })
        })
      }
    } catch (error) {
      window.core.dialog.showMessageBox({
        type: "error",
        title,
        message: getApiErrorMessage(error)
      })
    } finally {
      setInstallingRelease(null)
    }
  }

  // The header button installs/updates to the latest release; the per-release buttons target
  // a specific version.
  const installLatest = (detail: RepositoryPluginDetail) => {
    const latest = latestRelease(detail.releases)
    if (latest) installRelease(detail, latest)
  }

  // Derives the button state for a plugin: "update" when the repository has a strictly higher
  // version than the installed one, "installed" when it is up to date (or newer), and
  // "install" when it is not installed at all.
  const installStateFor = (d: RepositoryPluginDetail): InstallState => {
    const installed = installedPlugins.get(pluginKey(d))
    if (!installed) return "install"
    return isNewerRelease(latestRelease(d.releases), installed.version) ? "update" : "installed"
  }

  // Whether a list item has a newer release than the installed version. Reads `latest_release`
  // (the `releases` array is empty in listings) and shares `isNewerRelease` with
  // `installStateFor`, so the list dot and the detail button cannot disagree.
  const hasUpdate = (plugin: RepositoryPlugin): boolean => {
    const installed = installedPlugins.get(pluginKey(plugin))
    return installed !== undefined && isNewerRelease(plugin.latest_release, installed.version)
  }

  return {
    installedPlugins,
    installingRelease,
    isInstalling,
    installRelease,
    installLatest,
    installStateFor,
    hasUpdate
  }
}
