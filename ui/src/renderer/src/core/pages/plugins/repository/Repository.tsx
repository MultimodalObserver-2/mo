import { useTranslation } from "react-i18next"
import { useMatch, useNavigate } from "react-router"
import { RepositoryPlugin } from "@renderer/core/types/RepositoryPlugin"
import { latestRelease } from "@renderer/core/services/PluginRepositoryService"
import { pluginKey } from "./repositoryHelpers"
import usePluginSearch from "./usePluginSearch"
import usePluginDetail from "./usePluginDetail"
import useInstalledPlugins from "./useInstalledPlugins"
import {
  PluginCard,
  PluginDisplay,
  PluginDisplayList
} from "@renderer/core/components/plugin-display"
import PluginDetailView from "./PluginDetailView"
import RepositoryFilters from "./RepositoryFilters"
import pluginFallback from "@renderer/core/assets/images/plugin_fallback.svg"
import styles from "./repository.module.css"

export default function Repository() {
  const { t } = useTranslation("core", { keyPrefix: "pages.pluginRepository" })
  const navigate = useNavigate()
  const match = useMatch("/plugins/repository/:pluginSlug")
  const selectedSlug = match?.params.pluginSlug ?? null

  const {
    plugins,
    isLoadingList,
    isLoadingMore,
    listError,
    sentinelRef,
    searchQuery,
    setSearchQuery,
    category,
    setCategory,
    selectedTags,
    setSelectedTags
  } = usePluginSearch()

  const { detail, isLoadingDetail, isLoadingReleases, activeTab, setActiveTab } =
    usePluginDetail(selectedSlug)

  const {
    installedPlugins,
    installingRelease,
    isInstalling,
    installRelease,
    installLatest,
    installStateFor,
    hasUpdate
  } = useInstalledPlugins()

  const handleSelect = (plugin: RepositoryPlugin) => {
    navigate(`/plugins/repository/${pluginKey(plugin)}`)
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
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      <RepositoryFilters
        category={category}
        onCategoryChange={setCategory}
        selectedTags={selectedTags}
        onTagsChange={setSelectedTags}
        t={t}
      />

      <div className={styles.panels}>
        <div className={styles["list-panel"]}>
          {listError ? (
            <div className={styles["list-error"]}>
              <span>{t("connectionError")}</span>
              <span className={styles["list-error-hint"]}>{t("connectionErrorHint")}</span>
            </div>
          ) : !isLoadingList && plugins.length === 0 ? (
            <div className={styles["detail-empty"]}>{t("noResults")}</div>
          ) : (
            <PluginDisplay style="light" textSize="sm" isLoading={isLoadingList}>
              <PluginDisplayList isLoading={isLoadingList} selectable>
                {plugins.map((plugin) => (
                  <div key={plugin._id} className={styles["card-wrapper"]}>
                    <PluginCard
                      name={plugin.name}
                      description={plugin.description ?? ""}
                      iconPath={plugin.logo_url || pluginFallback}
                      isSelected={selectedSlug === pluginKey(plugin)}
                      showActions={false}
                      onClick={() => handleSelect(plugin)}
                    />
                    {hasUpdate(plugin) && <span className={styles["update-dot"]} />}
                  </div>
                ))}
                <div ref={sentinelRef} className={styles["list-sentinel"]} />
                {isLoadingMore && <div className={styles["list-loading-more"]}>{t("loading")}</div>}
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
              installState={installStateFor(detail)}
              latestVersion={latestRelease(detail.releases)?.name}
              installedVersion={installedPlugins.get(pluginKey(detail))?.version}
              isInstalling={isInstalling}
              installingReleaseName={installingRelease}
              isLoadingReleases={isLoadingReleases}
              onInstall={() => installLatest(detail)}
              onInstallRelease={(release) => installRelease(detail, release)}
            />
          ) : null}
        </div>
      </div>
    </div>
  )
}
