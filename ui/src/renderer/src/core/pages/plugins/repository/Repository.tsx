import { useEffect, useState } from "react"
import { useTranslation } from "react-i18next"
import { RepositoryPlugin, RepositoryPluginDetail } from "@renderer/core/types/RepositoryPlugin"
import pluginRepositoryService from "@renderer/core/services/PluginRepositoryService"
import {
  PluginCard,
  PluginDisplay,
  PluginDisplayList
} from "@renderer/core/components/plugin-display"
import styles from "./repository.module.css"

type DetailTab = "description" | "releases"

export default function Repository() {
  const { t } = useTranslation("core", { keyPrefix: "pages.pluginRepository" })
  const [plugins, setPlugins] = useState<RepositoryPlugin[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [detail, setDetail] = useState<RepositoryPluginDetail | null>(null)
  const [isLoadingList, setIsLoadingList] = useState(true)
  const [isLoadingDetail, setIsLoadingDetail] = useState(false)
  const [activeTab, setActiveTab] = useState<DetailTab>("description")

  useEffect(() => {
    pluginRepositoryService
      .getAll()
      .then(setPlugins)
      .catch(() => setPlugins([]))
      .finally(() => setIsLoadingList(false))
  }, [])

  const handleSelect = async (plugin: RepositoryPlugin) => {
    if (selectedId === plugin._id) return
    setSelectedId(plugin._id)
    setDetail(null)
    setActiveTab("description")
    setIsLoadingDetail(true)
    try {
      const data = await pluginRepositoryService.getBySlug(plugin.publisher_slug, plugin.slug)
      setDetail(data)
    } catch {
      setDetail(null)
    }
    setIsLoadingDetail(false)
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
          <PluginDisplay style="light" textSize="sm" isLoading={isLoadingList}>
            <PluginDisplayList isLoading={isLoadingList} selectable>
              {plugins.map((plugin) => (
                <PluginCard
                  key={plugin._id}
                  name={plugin.name}
                  description={plugin.description}
                  iconPath={plugin.logo_url ?? ""}
                  isSelected={selectedId === plugin._id}
                  showActions={false}
                  onClick={() => handleSelect(plugin)}
                />
              ))}
            </PluginDisplayList>
          </PluginDisplay>
        </div>

        <div className={styles["detail-panel"]}>
          {!selectedId ? (
            <div className={styles["detail-empty"]}>{t("selectPlugin")}</div>
          ) : isLoadingDetail ? (
            <div className={styles["detail-empty"]}>{t("loading")}</div>
          ) : detail ? (
            <PluginDetailView
              detail={detail}
              activeTab={activeTab}
              onTabChange={setActiveTab}
              t={t}
            />
          ) : null}
        </div>
      </div>
    </div>
  )
}

function PluginDetailView({
  detail,
  activeTab,
  onTabChange,
  t
}: {
  detail: RepositoryPluginDetail
  activeTab: DetailTab
  onTabChange: (tab: DetailTab) => void
  t: (key: string) => string
}) {
  return (
    <div className={styles["detail-view"]}>
      <div className={styles["detail-header"]}>
        {detail.logo_url && (
          <img
            className={styles["detail-logo"]}
            src={detail.logo_url}
            alt={detail.name}
            onError={(e) => {
              e.currentTarget.style.display = "none"
            }}
          />
        )}
        <div className={styles["detail-info"]}>
          <h2 className={styles["detail-name"]}>{detail.name}</h2>
          <div className={styles["detail-meta"]}>
            <span><strong>{t("fieldPublisher")}:</strong> {detail.publisher.name}</span>
            <span><strong>{t("fieldType")}:</strong> {detail.type}</span>
            {detail.author && (
              <span><strong>{t("fieldAuthor")}:</strong> {detail.author.name}</span>
            )}
          </div>
          <p className={styles["detail-description"]}>{detail.description}</p>
        </div>
      </div>

      <div className={styles["detail-nav"]}>
        <button
          className={`${styles["nav-btn"]} ${activeTab === "description" ? styles["nav-btn-active"] : ""}`}
          onClick={() => onTabChange("description")}
        >
          {t("tabDescription")}
        </button>
        <button
          className={`${styles["nav-btn"]} ${activeTab === "releases" ? styles["nav-btn-active"] : ""}`}
          onClick={() => onTabChange("releases")}
        >
          {t("tabReleases")}
        </button>
      </div>

      <div className={styles["detail-content"]}>
        {activeTab === "description" ? (
          detail.long_description ? (
            <pre className={styles["long-description"]}>{detail.long_description}</pre>
          ) : (
            <p className={styles["detail-placeholder"]}>{t("noDescription")}</p>
          )
        ) : detail.releases.length === 0 ? (
          <p className={styles["detail-placeholder"]}>{t("noReleases")}</p>
        ) : (
          <div className={styles.releases}>
            {detail.releases.map((release) => (
              <div key={release._id} className={styles.release}>
                <div className={styles["release-header"]}>
                  <span className={styles["release-name"]}>{release.name}</span>
                  <span className={styles["release-status"]}>{release.status}</span>
                </div>
                <div className={styles.assets}>
                  {release.assets.map((asset) => (
                    <div key={asset.asset_github_id} className={styles.asset}>
                      <span className={styles["asset-so"]}>{asset.so}</span>
                      <span className={styles["asset-name"]}>{asset.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
