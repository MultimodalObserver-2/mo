import { useCallback, useEffect, useRef, useState } from "react"
import pluginRepositoryService from "@renderer/core/services/PluginRepositoryService"
import { PluginCategory, RepositoryPlugin } from "@renderer/core/types/RepositoryPlugin"

type SearchFilters = {
  query?: string
  category?: PluginCategory
  tags: string[]
}

const PER_PAGE = 20
const SEARCH_DEBOUNCE_MS = 1000

/**
 * Owns the repository search/list: the free-text query (debounced), the category and tag
 * filters, pagination and infinite scroll. Resolves the repository client on mount and only
 * enables searching once ready. Returns what the page needs to render the list and to wire
 * the search bar and the filters.
 */
export default function usePluginSearch() {
  const [plugins, setPlugins] = useState<RepositoryPlugin[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [debouncedQuery, setDebouncedQuery] = useState("")
  const [category, setCategory] = useState<PluginCategory | undefined>(undefined)
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [isReady, setIsReady] = useState(false)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [isLoadingList, setIsLoadingList] = useState(true)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const [listError, setListError] = useState(false)

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

  // Resolve the repository client (its configured base URL). Searching is enabled only once
  // this completes.
  useEffect(() => {
    pluginRepositoryService
      .initialize()
      .then(() => setIsReady(true))
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

  return {
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
  }
}
