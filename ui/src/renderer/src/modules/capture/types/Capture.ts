export type StartCaptureRequest = {
  project_name: string
  participant_code: string
}

export type CaptureStatus = {
  started: boolean
  paused: boolean
  project_name?: string
  participant_code?: string
}
