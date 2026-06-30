import { useCallback, useEffect, useRef, useState } from "react"
import { useTranslation } from "react-i18next"
import { useMatch, useNavigate } from "react-router"
import {
  PluginCategory,
  RepositoryPlugin,
  RepositoryPluginDetail
} from "@renderer/core/types/RepositoryPlugin"
import pluginRepositoryService from "@renderer/core/services/PluginRepositoryService"
import pluginService from "@renderer/core/services/PluginService"
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
  const [listError, setListError] = useState(false)
  const [installedIds, setInstalledIds] = useState<Set<string>>(new Set())
  const [activeTab, setActiveTab] = useState<DetailTab>("description")
  const [isInstalling, setIsInstalling] = useState(false)

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
          .then((installed) => setInstalledIds(new Set(installed.map((p) => p.id))))
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
                  <PluginCard
                    key={plugin._id}
                    name={plugin.name}
                    description={plugin.description ?? ""}
                    iconPath={plugin.logo_url || pluginFallback}
                    isSelected={selectedSlug === `${plugin.publisher_slug}.${plugin.slug}`}
                    showActions={false}
                    onClick={() => handleSelect(plugin)}
                  />
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
