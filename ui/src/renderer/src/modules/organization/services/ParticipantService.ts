import { AxiosResponse } from "axios"
import axios from "@renderer/core/lib/axios"
import { Participant, ParticipantCreate } from "../types/Participant"
import projectService from "./ProjectService"

class ParticipantService {
  readonly endpoint = "/projects"

  async create(
    projectName: string,
    data: ParticipantCreate
  ): Promise<AxiosResponse<Participant, unknown>> {
    return axios.post(`${this.endpoint}/${projectName}/participants/`, data)
  }

  async getAll(projectName: string): Promise<AxiosResponse<Participant[], unknown>> {
    return axios.get(`${this.endpoint}/${projectName}/participants/`)
  }

  async get(
    projectName: string,
    participantCode: string
  ): Promise<AxiosResponse<Participant, unknown>> {
    return axios.get(`${this.endpoint}/${projectName}/participants/${participantCode}`)
  }

  async getByUuid(
    projectName: string,
    participantUuid: string
  ): Promise<AxiosResponse<Participant, unknown>> {
    return axios.get(`${this.endpoint}/${projectName}/participants/byuuid/${participantUuid}`)
  }

  async update(
    projectName: string,
    participantCode: string,
    data: ParticipantCreate
  ): Promise<AxiosResponse<Participant, unknown>> {
    return axios.put(`${this.endpoint}/${projectName}/participants/${participantCode}`, data)
  }

  async delete(
    projectName: string,
    participantCode: string
  ): Promise<AxiosResponse<void, unknown>> {
    return axios.delete(`${this.endpoint}/${projectName}/participants/${participantCode}`)
  }

  async lock(
    projectName: string,
    participantCode: string
  ): Promise<AxiosResponse<Participant, unknown>> {
    return axios.post(`${this.endpoint}/${projectName}/participants/${participantCode}/lock`)
  }

  async unlock(
    projectName: string,
    participantCode: string
  ): Promise<AxiosResponse<Participant, unknown>> {
    return axios.post(`${this.endpoint}/${projectName}/participants/${participantCode}/unlock`)
  }

  async getSelectedParticipant(): Promise<Participant | null> {
    const project = await projectService.getSelectedProject()
    if (!project) {
      return null
    }
    const participantUuid = await window.organization.preferences.state.getParticipant()
    if (!participantUuid) {
      return null
    }
    try {
      const response = await this.getByUuid(project.name, participantUuid)
      return response.data
    } catch (error) {
      console.error("Failed to fetch participant by UUID:", error)
      return null
    }
  }
}

const participantService = new ParticipantService()

export default participantService
