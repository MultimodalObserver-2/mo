import axios from "@renderer/core/lib/axios"
import { Protocol, ProtocolCreate } from "../types/Protocol"
import { AxiosResponse } from "axios"

class ProtocolService {
  readonly endpoint = "/projects"
  readonly protocolEndpoint = "/protocols"

  async create(
    projectName: string,
    data: ProtocolCreate
  ): Promise<AxiosResponse<Protocol, unknown>> {
    return axios.post(`${this.endpoint}/${projectName}${this.protocolEndpoint}/`, data)
  }

  async getAll(projectName: string): Promise<AxiosResponse<Protocol[], unknown>> {
    return axios.get(`${this.endpoint}/${projectName}${this.protocolEndpoint}/`)
  }

  async delete(
    projectName: string,
    protocolName: string
  ): Promise<AxiosResponse<unknown, unknown>> {
    return axios.delete(`${this.endpoint}/${projectName}${this.protocolEndpoint}/${protocolName}/`)
  }
}

const protocolService = new ProtocolService()
export default protocolService
