import { AxiosResponse } from "axios"
import axios from "@renderer/core/lib/axios"
import { Project, ProjectCreate } from "../types/Project"

class ProjectService {
  readonly endpoint = "/projects"

  async create(data: ProjectCreate): Promise<AxiosResponse<Project, unknown>> {
    return axios.post(`${this.endpoint}/`, data)
  }
}

const projectService = new ProjectService()

export default projectService
