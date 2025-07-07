export type Project = {
  uuid: string
  name: string
  description: string
  location: string
  locked: boolean
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
