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

/** A downloadable asset of a release (`AssetRead`). */
export type RepositoryReleaseAsset = {
  asset_github_id: number
  name: string
  content_type: string
  /** Operating system the asset targets (`windows`, `linux`, `macos`). */
  so: string
  /** Direct GitHub download URL. Absent on older payloads. */
  browser_download_url?: string
}

/**
 * A plugin release (`ReleaseRead`). Returned both inside a plugin's `releases` (detail)
 * and as `latest_release` (listings). Fields that only some endpoints populate are optional.
 */
export type RepositoryRelease = {
  _id?: string
  /** Semantic version, `x.y.z`. */
  name: string
  description?: string
  repository_id: string
  release_github_id: number
  status?: string
  required_reviewers?: number
  assets: RepositoryReleaseAsset[]
}

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
  /**
   * Highest-version release, populated by the `/search` listing (the `releases` array
   * stays empty there). `null` when the plugin has no releases.
   */
  latest_release?: RepositoryRelease | null
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
  releases: RepositoryRelease[]
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
