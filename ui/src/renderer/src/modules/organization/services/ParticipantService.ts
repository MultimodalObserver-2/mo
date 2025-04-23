import { AxiosResponse } from "axios"
import axios from "@renderer/core/lib/axios"
import { Participant, ParticipantCreate } from "../types/Participant"

class ParticipantService {
  readonly endpoint = "/projects"

  async create(
    projectName: string,
    data: ParticipantCreate
  ): Promise<AxiosResponse<Participant, unknown>> {
    return axios.post(`${this.endpoint}/${projectName}/participants`, data)
  }
}

const participantService = new ParticipantService()

export default participantService
