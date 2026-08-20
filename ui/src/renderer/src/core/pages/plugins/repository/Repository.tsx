import { useTranslation } from "react-i18next"
import { useMatch, useNavigate } from "react-router"
import { RepositoryPlugin } from "@renderer/core/types/RepositoryPlugin"
import { latestRelease } from "@renderer/core/services/PluginRepositoryService"
import { pluginKey } from "./repositoryHelpers"
import usePluginSearch from "./usePluginSearch"
import usePluginDetail from "./usePluginDetail"
import useInstalledPlugins from "./useInstalledPlugins"
import SearchBar from "@renderer/core/components/search-bar/SearchBar"
import RepositoryList from "@renderer/core/components/repository-list/RepositoryList"
import RepositoryFilters from "@renderer/core/components/repository-filters/RepositoryFilters"
import PluginDetailView from "./PluginDetailView"
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
      <SearchBar
        value={searchQuery}
        onChange={setSearchQuery}
        placeholder={t("searchPlaceholder")}
      />

      <RepositoryFilters
        category={category}
        onCategoryChange={setCategory}
        selectedTags={selectedTags}
        onTagsChange={setSelectedTags}
        t={t}
      />

      <div className={styles.panels}>
        <div className={styles["list-panel"]}>
          <RepositoryList
            plugins={plugins}
            isLoadingList={isLoadingList}
            isLoadingMore={isLoadingMore}
            listError={listError}
            isSelected={(plugin) => selectedSlug === pluginKey(plugin)}
            hasUpdate={hasUpdate}
            onSelect={handleSelect}
            sentinelRef={sentinelRef}
            t={t}
          />
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
