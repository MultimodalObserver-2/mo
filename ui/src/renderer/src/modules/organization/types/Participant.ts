export type Participant = {
  uuid: string
  code: string
  name: string
  notes: string[]
  location: string
  locked: boolean
  created_at: string
  updated_at: string
}

export type ParticipantCreate = {
  code: string
  name: string
  notes?: string[]
}
