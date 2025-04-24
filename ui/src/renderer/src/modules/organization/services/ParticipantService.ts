import { AxiosResponse } from "axios"
import axios from "@renderer/core/lib/axios"
import { Participant, ParticipantCreate } from "../types/Participant"

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

  async update(
    projectName: string,
    participantCode: string,
    data: ParticipantCreate
  ): Promise<AxiosResponse<Participant, unknown>> {
    return axios.put(`${this.endpoint}/${projectName}/participants/${participantCode}`, data)
  }
}

const participantService = new ParticipantService()

export default participantService
