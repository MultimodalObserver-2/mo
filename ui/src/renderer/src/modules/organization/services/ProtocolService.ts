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

  async get(projectName: string, protocolName: string): Promise<AxiosResponse<Protocol, unknown>> {
    return axios.get(`${this.endpoint}/${projectName}${this.protocolEndpoint}/${protocolName}`)
  }

  async update(
    projectName: string,
    protocolName: string,
    data: ProtocolCreate
  ): Promise<AxiosResponse<Protocol, unknown>> {
    return axios.put(
      `${this.endpoint}/${projectName}${this.protocolEndpoint}/${protocolName}`,
      data
    )
  }

  async delete(
    projectName: string,
    protocolName: string
  ): Promise<AxiosResponse<unknown, unknown>> {
    return axios.delete(`${this.endpoint}/${projectName}${this.protocolEndpoint}/${protocolName}`)
  }

  async lock(projectName: string, protocolName: string): Promise<AxiosResponse<Protocol, unknown>> {
    return axios.post(
      `${this.endpoint}/${projectName}${this.protocolEndpoint}/${protocolName}/lock`
    )
  }

  async unlock(
    projectName: string,
    protocolName: string
  ): Promise<AxiosResponse<Protocol, unknown>> {
    return axios.post(
      `${this.endpoint}/${projectName}${this.protocolEndpoint}/${protocolName}/unlock`
    )
  }
}

const protocolService = new ProtocolService()
export default protocolService
