import { useCallback, useEffect, useRef, useState } from "react"
import { useTranslation } from "react-i18next"
import { useMatch, useNavigate } from "react-router"
import {
  PluginCategory,
  RepositoryPlugin,
  RepositoryPluginDetail,
  RepositoryRelease
} from "@renderer/core/types/RepositoryPlugin"
import pluginRepositoryService, {
  latestRelease
} from "@renderer/core/services/PluginRepositoryService"
import pluginService from "@renderer/core/services/PluginService"
import { Plugin } from "@renderer/core/types/Plugin"
import { compareVersions } from "@renderer/core/utils/compareVersions"
import {
  getApiErrorMessage,
  showUnvalidatedPluginMessage
} from "@renderer/core/utils/dialogMessages"
import {
  PluginCard,
  PluginDisplay,
  PluginDisplayList
} from "@renderer/core/components/plugin-display"
import PluginDetailView from "./PluginDetailView"
import RepositoryFilters from "./RepositoryFilters"
import pluginFallback from "@renderer/core/assets/images/plugin_fallback.svg"
import styles from "./repository.module.css"

type DetailTab = "description" | "releases"

type InstallState = "install" | "update" | "installed"

type SearchFilters = {
  query?: string
  category?: PluginCategory
  tags: string[]
}

const PER_PAGE = 20
const SEARCH_DEBOUNCE_MS = 1000

export default function Repository() {
  const { t } = useTranslation("core", { keyPrefix: "pages.pluginRepository" })
  const navigate = useNavigate()
  const match = useMatch("/plugins/repository/:pluginSlug")
  const selectedSlug = match?.params.pluginSlug ?? null

  const [plugins, setPlugins] = useState<RepositoryPlugin[]>([])
  const [detail, setDetail] = useState<RepositoryPluginDetail | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [debouncedQuery, setDebouncedQuery] = useState("")
  const [category, setCategory] = useState<PluginCategory | undefined>(undefined)
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [isReady, setIsReady] = useState(false)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [isLoadingList, setIsLoadingList] = useState(true)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const [isLoadingDetail, setIsLoadingDetail] = useState(false)
  const [isLoadingReleases, setIsLoadingReleases] = useState(false)
  const [listError, setListError] = useState(false)
  const [installedPlugins, setInstalledPlugins] = useState<Map<string, Plugin>>(new Map())
  const [activeTab, setActiveTab] = useState<DetailTab>("description")
  // Name (version) of the release currently being installed, or null when idle. A single
  // in-flight install at a time: this both flags global busy-ness and marks which button spins.
  const [installingRelease, setInstallingRelease] = useState<string | null>(null)
  const isInstalling = installingRelease !== null

  // Monotonic counter to discard responses from superseded requests (e.g. a stale
  // search resolving after the user already typed a newer query).
  const requestSeq = useRef(0)
  const sentinelRef = useRef<HTMLDivElement | null>(null)

  // Fetches one page from the `/search` endpoint. `append` adds the results to the
  // current list (infinite scroll); otherwise it replaces them (new search / first load).
  const fetchPage = useCallback(
    async (filters: SearchFilters, pageToLoad: number, append: boolean) => {
      const seq = ++requestSeq.current
      if (append) setIsLoadingMore(true)
      else setIsLoadingList(true)
      setListError(false)
      try {
        const result = await pluginRepositoryService.search({
          query: filters.query,
          category: filters.category,
          tags: filters.tags,
          page: pageToLoad,
          perPage: PER_PAGE
        })
        if (seq !== requestSeq.current) return // a newer request superseded this one
        setPlugins((prev) => (append ? [...prev, ...result.items] : result.items))
        setPage(result.page)
        setTotalPages(result.total_pages)
      } catch {
        if (seq === requestSeq.current) setListError(true)
      } finally {
        if (append) setIsLoadingMore(false)
        else if (seq === requestSeq.current) setIsLoadingList(false)
      }
    },
    []
  )

  // Builds the active filter set. The backend requires text queries of at least 2
  // characters; shorter input is omitted so all plugins are listed.
  const buildFilters = useCallback((): SearchFilters => {
    const trimmed = debouncedQuery.trim()
    return {
      query: trimmed.length >= 2 ? trimmed : undefined,
      category,
      tags: selectedTags
    }
  }, [debouncedQuery, category, selectedTags])

  // Initialize the repository client (resolves the configured base URL) and load the
  // set of already-installed plugins. Searching is enabled only once this completes.
  useEffect(() => {
    pluginRepositoryService
      .initialize()
      .then(() => {
        setIsReady(true)
        return pluginService
          .getAll()
          .then((installed) => setInstalledPlugins(new Map(installed.map((p) => [p.id, p]))))
      })
      .catch(() => {
        setListError(true)
        setIsLoadingList(false)
      })
  }, [])

  // Debounce only the free-text query; category and tag changes apply immediately.
  useEffect(() => {
    const handle = setTimeout(() => setDebouncedQuery(searchQuery), SEARCH_DEBOUNCE_MS)
    return () => clearTimeout(handle)
  }, [searchQuery])

  // (Re)load the first page whenever the active filters change. Replaces the list and
  // resets pagination.
  useEffect(() => {
    if (!isReady) return
    fetchPage(buildFilters(), 1, false)
  }, [isReady, buildFilters, fetchPage])

  // Infinite scroll: load the next page when the sentinel at the bottom of the list
  // becomes visible, until there are no more pages.
  useEffect(() => {
    const sentinel = sentinelRef.current
    if (!sentinel || page >= totalPages) return

    const root = document.getElementById("plugin-display-list")
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !isLoadingList && !isLoadingMore) {
          fetchPage(buildFilters(), page + 1, true)
        }
      },
      { root, rootMargin: "120px" }
    )
    observer.observe(sentinel)
    return () => observer.disconnect()
  }, [page, totalPages, isLoadingList, isLoadingMore, buildFilters, fetchPage])

  useEffect(() => {
    if (!selectedSlug) {
      setDetail(null)
      return
    }
    const dotIndex = selectedSlug.indexOf(".")
    const publisherSlug = selectedSlug.substring(0, dotIndex)
    const slug = selectedSlug.substring(dotIndex + 1)

    // Guards against a slower response landing after the user selected another plugin.
    let cancelled = false
    setDetail(null)
    setActiveTab("description")
    setIsLoadingDetail(true)
    setIsLoadingReleases(true)

    pluginRepositoryService
      .getBySlug(publisherSlug, slug)
      .then((d) => {
        if (cancelled) return
        setDetail(d)
        // The detail's own `releases` is capped; replace it with the full history from the
        // dedicated `/releases` endpoint. Everything downstream (release list, latest-release
        // and install/update logic) then reads the complete set from `detail.releases`.
        pluginRepositoryService
          .getReleases(d._id)
          .then((releases) => {
            if (!cancelled) setDetail((prev) => (prev ? { ...prev, releases } : prev))
          })
          .catch(() => {
            // Keep the detail's capped releases if the full fetch fails.
          })
          .finally(() => {
            if (!cancelled) setIsLoadingReleases(false)
          })
      })
      .catch(() => {
        if (!cancelled) {
          setDetail(null)
          setIsLoadingReleases(false)
        }
      })
      .finally(() => {
        if (!cancelled) setIsLoadingDetail(false)
      })

    return () => {
      cancelled = true
    }
  }, [selectedSlug])

  const handleSelect = (plugin: RepositoryPlugin) => {
    navigate(`/plugins/repository/${plugin.publisher_slug}.${plugin.slug}`)
  }

  // Installs (or updates to) a specific `release`. `release` need not be the latest: any
  // version other than the installed one can be picked from the releases list.
  const handleInstallRelease = async (release: RepositoryRelease) => {
    if (!detail || isInstalling) return
    const installed = installedPlugins.get(`${detail.publisher_slug}.${detail.slug}`)
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
        ? await pluginRepositoryService.updatePlugin(detail, installed, release)
        : await pluginRepositoryService.installPlugin(detail, release)
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

  // The header button installs/updates to the latest release; the per-release buttons in the
  // list target a specific version.
  const handleInstallLatest = () => {
    if (!detail) return
    const latest = latestRelease(detail.releases)
    if (latest) handleInstallRelease(latest)
  }

  // Derives the button state for a plugin: "update" when the repository has a strictly
  // higher version than the installed one, "installed" when it is up to date (or newer),
  // and "install" when it is not installed at all.
  const installStateFor = (d: RepositoryPluginDetail): InstallState => {
    const installed = installedPlugins.get(`${d.publisher_slug}.${d.slug}`)
    if (!installed) return "install"
    const latest = latestRelease(d.releases)
    return latest && compareVersions(latest.name, installed.version) > 0 ? "update" : "installed"
  }

  // Whether the repository's latest release is strictly newer than the installed version.
  // Mirrors the "update" branch of `installStateFor`, but reads `latest_release` from the
  // list item, since its `releases` array is empty in listings.
  const hasUpdate = (plugin: RepositoryPlugin): boolean => {
    const installed = installedPlugins.get(`${plugin.publisher_slug}.${plugin.slug}`)
    return (
      installed !== undefined &&
      plugin.latest_release != null &&
      compareVersions(plugin.latest_release.name, installed.version) > 0
    )
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
                      isSelected={selectedSlug === `${plugin.publisher_slug}.${plugin.slug}`}
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
              installedVersion={
                installedPlugins.get(`${detail.publisher_slug}.${detail.slug}`)?.version
              }
              isInstalling={isInstalling}
              installingReleaseName={installingRelease}
              isLoadingReleases={isLoadingReleases}
              onInstall={handleInstallLatest}
              onInstallRelease={handleInstallRelease}
            />
          ) : null}
        </div>
      </div>
    </div>
  )
}
