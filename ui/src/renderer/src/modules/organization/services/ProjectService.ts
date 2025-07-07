import { AxiosResponse } from "axios"
import axios from "@renderer/core/lib/axios"
import { Project, ProjectCreate, ProjectUpdate } from "../types/Project"

class ProjectService {
  readonly endpoint = "/projects"

  async create(data: ProjectCreate): Promise<AxiosResponse<Project, unknown>> {
    return axios.post(`${this.endpoint}/`, data)
  }

  async getAll(): Promise<AxiosResponse<Project[], unknown>> {
    return axios.get(`${this.endpoint}/`)
  }

  async get(name: string): Promise<AxiosResponse<Project, unknown>> {
    return axios.get(`${this.endpoint}/${name}`)
  }

  async getByUuid(uuid: string): Promise<AxiosResponse<Project, unknown>> {
    return axios.get(`${this.endpoint}/byuuid/${uuid}`)
  }

  async update(name: string, data: ProjectUpdate): Promise<AxiosResponse<Project, unknown>> {
    return axios.put(`${this.endpoint}/${name}`, data)
  }

  async delete(name: string): Promise<AxiosResponse<void, unknown>> {
    return axios.delete(`${this.endpoint}/${name}`)
  }

  async lock(name: string): Promise<AxiosResponse<void, unknown>> {
    return axios.post(`${this.endpoint}/${name}/lock`)
  }

  async unlock(name: string): Promise<AxiosResponse<void, unknown>> {
    return axios.post(`${this.endpoint}/${name}/unlock`)
  }

  async getSelectedProject(): Promise<Project | null> {
    const projectUuid = await window.organization.preferences.state.getProject()
    if (!projectUuid) {
      return null
    }
    try {
      const response = await this.getByUuid(projectUuid)
      return response.data
    } catch (error) {
      console.error("Failed to fetch project by UUID:", error)
      return null
    }
  }
}

const projectService = new ProjectService()

export default projectService
