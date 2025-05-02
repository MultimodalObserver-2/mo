import axios from "@renderer/core/lib/axios"
import { ProtocolCreate } from "../types/Protocol"
import { AxiosResponse } from "axios"
import { Protocol } from "electron"

class ProtocolService {
  readonly endpoint = "/projects"
  readonly protocolEndpoint = "/protocols"

  async create(
    projectName: string,
    data: ProtocolCreate
  ): Promise<AxiosResponse<Protocol, unknown>> {
    return axios.post(`${this.endpoint}/${projectName}${this.protocolEndpoint}/`, data)
  }
}

const protocolService = new ProtocolService()
export default protocolService
