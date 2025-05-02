export type Activity = {
  order: number
  name: string
  path: string
  has_time_limit: boolean
  time_limit: number
  start_message: string
  end_message: string
  close_activity: boolean
  show_timer: boolean
}

export type Protocol = {
  name: string
  activities: Activity[]
  locked: boolean
  created_at: string
  updated_at: string
}

export type ActivityCreate = {
  name: string
  path: string
  has_time_limit: boolean
  time_limit: number
  start_message: string
  end_message: string
  close_activity: boolean
  show_timer: boolean
}

export type ProtocolCreate = {
  name: string
  activities: ActivityCreate[]
}
