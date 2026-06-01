import { useEffect, useState } from "react"
import { useTranslation } from "react-i18next"
import { useMatch, useNavigate } from "react-router"
import { RepositoryPlugin, RepositoryPluginDetail } from "@renderer/core/types/RepositoryPlugin"
import pluginRepositoryService from "@renderer/core/services/PluginRepositoryService"
import pluginService from "@renderer/core/services/PluginService"
import {
  PluginCard,
  PluginDisplay,
  PluginDisplayList
} from "@renderer/core/components/plugin-display"
import PluginDetailView from "./PluginDetailView"
import styles from "./repository.module.css"

type DetailTab = "description" | "releases"

export default function Repository() {
  const { t } = useTranslation("core", { keyPrefix: "pages.pluginRepository" })
  const navigate = useNavigate()
  const match = useMatch("/plugins/repository/:pluginSlug")
  const selectedSlug = match?.params.pluginSlug ?? null

  const [plugins, setPlugins] = useState<RepositoryPlugin[]>([])
  const [detail, setDetail] = useState<RepositoryPluginDetail | null>(null)
  const [isLoadingList, setIsLoadingList] = useState(true)
  const [isLoadingDetail, setIsLoadingDetail] = useState(false)
  const [listError, setListError] = useState(false)
  const [installedIds, setInstalledIds] = useState<Set<string>>(new Set())
  const [activeTab, setActiveTab] = useState<DetailTab>("description")
  const [isInstalling, setIsInstalling] = useState(false)

  useEffect(() => {
    pluginRepositoryService
      .initialize()
      .then(() =>
        Promise.all([
          pluginRepositoryService.getAll().then(setPlugins),
          pluginService
            .getAll()
            .then((installed) => setInstalledIds(new Set(installed.map((p) => p.id))))
        ])
      )
      .catch(() => setListError(true))
      .finally(() => setIsLoadingList(false))
  }, [])

  useEffect(() => {
    if (!selectedSlug) {
      setDetail(null)
      return
    }
    const dotIndex = selectedSlug.indexOf(".")
    const publisherSlug = selectedSlug.substring(0, dotIndex)
    const slug = selectedSlug.substring(dotIndex + 1)

    setDetail(null)
    setActiveTab("description")
    setIsLoadingDetail(true)
    pluginRepositoryService
      .getBySlug(publisherSlug, slug)
      .then(setDetail)
      .catch(() => setDetail(null))
      .finally(() => setIsLoadingDetail(false))
  }, [selectedSlug])

  const handleSelect = (plugin: RepositoryPlugin) => {
    navigate(`/plugins/repository/${plugin.publisher_slug}.${plugin.slug}`)
  }

  const handleInstall = async () => {
    if (!detail) return
    setIsInstalling(true)
    try {
      const plugin = await pluginRepositoryService.installPlugin(detail)
      setInstalledIds((prev) => new Set([...prev, plugin.id]))
      if (!plugin.is_loaded) {
        window.core.dialog.showMessageBox({
          type: "warning",
          title: t("installTitle"),
          message: t("installedButFailed", { error: plugin.error })
        })
      }
    } catch (error) {
      window.core.dialog.showMessageBox({
        type: "error",
        title: t("installTitle"),
        message: error instanceof Error ? error.message : String(error)
      })
    } finally {
      setIsInstalling(false)
    }
  }

  return (
    <div className={styles.container}>
      <div className={styles["search-bar"]}>
        <svg className={styles["search-icon"]} viewBox="0 0 24 24">
          <path d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0 0 16 9.5 6.5 6.5 0 1 0 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z" />
        </svg>
        <input
          className={styles["search-input"]}
          type="text"
          placeholder={t("searchPlaceholder")}
          disabled
        />
      </div>

      <div className={styles.panels}>
        <div className={styles["list-panel"]}>
          {listError ? (
            <div className={styles["list-error"]}>
              <span>{t("connectionError")}</span>
              <span className={styles["list-error-hint"]}>{t("connectionErrorHint")}</span>
            </div>
          ) : (
            <PluginDisplay style="light" textSize="sm" isLoading={isLoadingList}>
              <PluginDisplayList isLoading={isLoadingList} selectable>
                {plugins.map((plugin) => (
                  <PluginCard
                    key={plugin._id}
                    name={plugin.name}
                    description={plugin.description}
                    iconPath={plugin.logo_url ?? ""}
                    isSelected={selectedSlug === `${plugin.publisher_slug}.${plugin.slug}`}
                    showActions={false}
                    onClick={() => handleSelect(plugin)}
                  />
                ))}
              </PluginDisplayList>
            </PluginDisplay>
          )}
        </div>

        <div className={styles["detail-panel"]}>
          {!selectedSlug ? (
            <div className={styles["detail-empty"]}>{t("selectPlugin")}</div>
          ) : isLoadingDetail ? (
            <div className={styles["detail-empty"]}>{t("loading")}</div>
          ) : detail ? (
            <PluginDetailView
              detail={detail}
              activeTab={activeTab}
              onTabChange={setActiveTab}
              t={t}
              isInstalled={installedIds.has(`${detail.publisher_slug}.${detail.slug}`)}
              isInstalling={isInstalling}
              onInstall={handleInstall}
            />
          ) : null}
        </div>
      </div>
    </div>
  )
}
