export type Project = {
  name: string
  description: string
  location: string
  created_at: string
  updated_at: string
}

export type ProjectCreate = {
  name: string
  description?: string
}

export type ProjectUpdate = {
  name?: string
  description?: string
}
