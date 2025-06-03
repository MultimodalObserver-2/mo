export type CaptureSettingDetails = {
  setting_name: string
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
  start_timestamp: string
  end_timestamp?: string
  started_at: string
  capture_sources: CaptureSettingDetails[]
}
