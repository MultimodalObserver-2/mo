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

  async update(name: string, data: ProjectUpdate): Promise<AxiosResponse<Project, unknown>> {
    return axios.put(`${this.endpoint}/${name}`, data)
  }
}

const projectService = new ProjectService()

export default projectService
