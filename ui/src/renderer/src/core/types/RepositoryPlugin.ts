/** Categories supported by the repository (`PluginCategory` on the backend). */
export type PluginCategory = "capture" | "visualization" | "analysis" | "browser"

export const PLUGIN_CATEGORIES: PluginCategory[] = [
  "capture",
  "visualization",
  "analysis",
  "browser"
]

/** Release-derived status of a plugin (`PluginStatus` on the backend). */
export type PluginStatus = "no_releases" | "under_review" | "approved"

/** Maximum number of tags accepted by the repository `/search` endpoint. */
export const MAX_TAGS_PER_SEARCH = 5

/** A plugin as returned by the repository (`PluginRead`). */
export type RepositoryPlugin = {
  _id: string
  slug?: string
  name: string
  description?: string
  long_description?: string
  author_id?: string
  publisher_slug: string
  repository_url?: string
  logo_url?: string
  image_url?: string[]
  github_id?: number
  category?: PluginCategory
  tags?: string[]
  status?: PluginStatus
  average_rating: number
  reviews_count: number
  created_at?: string
  updated_at?: string
}

/** A plugin with its publisher, author and releases populated (detail view). */
export type RepositoryPluginDetail = RepositoryPlugin & {
  publisher: {
    _id: string
    name: string
    slug: string
    logo_url?: string
    website?: string
  }
  author?: {
    _id: string
    name: string
    email?: string
    image_profile_url?: string
  }
  releases: {
    _id: string
    name: string
    description?: string
    repository_id: string
    release_github_id: number
    status: string
    assets: {
      asset_github_id: number
      name: string
      content_type: string
      so: string
    }[]
  }[]
}

/** A tag as returned by the repository (`TagRead`). */
export type RepositoryTag = {
  _id: string
  name: string
  created_by?: string
  created_at?: string
}

/** Paginated plugin response (`PluginPagination`). */
export type RepositoryPluginsPage = {
  total: number
  page: number
  per_page: number
  total_pages: number
  items: RepositoryPlugin[]
}
