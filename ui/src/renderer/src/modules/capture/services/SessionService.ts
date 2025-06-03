import axios from "@renderer/core/lib/axios"
import { AxiosResponse } from "axios"
import { CaptureSession } from "../types/Session"

class SessionService {
  async getAll(
    project_name: string,
    participant_code: string
  ): Promise<AxiosResponse<CaptureSession[], unknown>> {
    return axios.get(`/projects/${project_name}/participants/${participant_code}/sessions`)
  }

  async get(
    project_name: string,
    participant_code: string,
    session_id: string
  ): Promise<AxiosResponse<CaptureSession, unknown>> {
    return axios.get(
      `/projects/${project_name}/participants/${participant_code}/sessions/${session_id}`
    )
  }
}

const sessionService = new SessionService()
export default sessionService
