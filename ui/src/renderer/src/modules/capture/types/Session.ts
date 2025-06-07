export type CaptureConfigDetails = {
  config_name: string
  plugin_id: string
  plugin_name: string
  plugin_version: string
  settings: Record<string, unknown>
  start_timestamp?: string
  file_extension?: string
  location?: string
}

export type CaptureSession = {
  session_id: string
  location: string
  start_timestamp: number
  end_timestamp?: number
  paused_time?: number
  started_at: string
  ended_at?: string
  duration: number
  capture_sources: CaptureConfigDetails[]
}
