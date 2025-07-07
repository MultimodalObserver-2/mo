import axios from "@renderer/core/lib/axios"
import { Protocol, ProtocolCreate } from "../types/Protocol"
import { AxiosResponse } from "axios"
import projectService from "./ProjectService"

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

  async getByUuid(
    projectName: string,
    protocolUuid: string
  ): Promise<AxiosResponse<Protocol, unknown>> {
    return axios.get(
      `${this.endpoint}/${projectName}${this.protocolEndpoint}/byuuid/${protocolUuid}`
    )
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

  async getSelectedProtocol(): Promise<Protocol | null> {
    const project = await projectService.getSelectedProject()
    if (!project) {
      return null
    }
    const protocolUuid = await window.organization.preferences.state.getProtocol()
    if (!protocolUuid) {
      return null
    }
    try {
      const response = await this.getByUuid(project.name, protocolUuid)
      return response.data
    } catch (error) {
      console.error("Failed to fetch protocol by UUID:", error)
      return null
    }
  }
}

const protocolService = new ProtocolService()
export default protocolService
