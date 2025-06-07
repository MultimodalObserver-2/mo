import axios from "@renderer/core/lib/axios"
import { AxiosResponse } from "axios"
import { CaptureConfig, CaptureConfigCreate, CaptureConfigUpdate } from "../types/CaptureConfig"

class CaptureConfigService {
  async create(
    projectName: string,
    data: CaptureConfigCreate
  ): Promise<AxiosResponse<CaptureConfig, unknown>> {
    return axios.post(`/projects/${projectName}/capture/configs/`, data)
  }

  async getAll(projectName: string): Promise<AxiosResponse<CaptureConfig[], unknown>> {
    return axios.get(`/projects/${projectName}/capture/configs/`)
  }

  async get(
    projectName: string,
    configName: string
  ): Promise<AxiosResponse<CaptureConfig, unknown>> {
    return axios.get(`/projects/${projectName}/capture/configs/${configName}`)
  }

  async update(
    projectName: string,
    configName: string,
    config: CaptureConfigUpdate
  ): Promise<AxiosResponse<CaptureConfig, unknown>> {
    return axios.put(`/projects/${projectName}/capture/configs/${configName}`, config)
  }

  async delete(
    projectName: string,
    configName: string
  ): Promise<AxiosResponse<CaptureConfig, unknown>> {
    return axios.delete(`/projects/${projectName}/capture/configs/${configName}`)
  }
}

const captureConfigService = new CaptureConfigService()
export default captureConfigService
