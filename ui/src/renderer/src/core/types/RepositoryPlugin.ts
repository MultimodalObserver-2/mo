export type RepositoryPlugin = {
  _id: string
  slug: string
  name: string
  description: string
  long_description?: string
  author_id: string
  publisher_slug: string
  repository_url?: string
  logo_url?: string
  image_url?: string[]
  github_id?: number
  type: string
}

export type RepositoryPluginDetail = {
  _id: string
  slug: string
  name: string
  description: string
  long_description?: string
  author_id: string
  publisher_slug: string
  repository_url?: string
  logo_url?: string
  image_url?: string[]
  github_id?: number
  type: string
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

export type RepositoryPluginsPage = {
  total: number
  page: number
  per_page: number
  total_pages: number
  items: RepositoryPlugin[]
}
