import axios from "@renderer/core/lib/axios"
import { AxiosResponse } from "axios"
import { CaptureSession } from "../types/Session"

class SessionService {
  async getAll(
    project_name: string,
    participant_code: string
  ): Promise<AxiosResponse<CaptureSession[], unknown>> {
    return axios.get(`/projects/${project_name}/participants/${participant_code}/sessions/`)
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

  async delete(
    project_name: string,
    participant_code: string,
    session_id: string
  ): Promise<AxiosResponse<void, unknown>> {
    return axios.delete(
      `/projects/${project_name}/participants/${participant_code}/sessions/${session_id}`
    )
  }

  async getLast(
    project_name: string,
    participant_code: string,
    available: boolean = true
  ): Promise<CaptureSession | null> {
    const sessions = await this.getSorted(project_name, participant_code, available)
    if (sessions.length === 0) {
      return null
    }

    return sessions[0]
  }

  async getAllAvailable(project_name: string, participant_code: string): Promise<CaptureSession[]> {
    const response = await this.getAll(project_name, participant_code)
    return response.data.filter((session) => session.duration > 0)
  }

  async getSorted(
    project_name: string,
    participant_code: string,
    desc: boolean = true,
    available: boolean = false
  ): Promise<CaptureSession[]> {
    let sessions: CaptureSession[] = []
    if (available) {
      sessions = await this.getAllAvailable(project_name, participant_code)
    } else {
      const response = await this.getAll(project_name, participant_code)
      sessions = response.data
    }
    return sessions.sort((a, b) => {
      const aTimestamp = new Date(a.started_at).getTime()
      const bTimestamp = new Date(b.started_at).getTime()
      return desc ? bTimestamp - aTimestamp : aTimestamp - bTimestamp
    })
  }
}

const sessionService = new SessionService()
export default sessionService
