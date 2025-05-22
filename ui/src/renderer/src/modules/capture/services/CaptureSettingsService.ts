import axios from "@renderer/core/lib/axios"
import { AxiosResponse } from "axios"
import { CaptureSetting, CaptureSettingCreate, CaptureSettingUpdate } from "../types/CaptureSetting"

class CaptureSettingsService {
  async create(
    projectName: string,
    data: CaptureSettingCreate
  ): Promise<AxiosResponse<CaptureSetting, unknown>> {
    return axios.post(`/projects/${projectName}/capture/settings/`, data)
  }

  async getAll(projectName: string): Promise<AxiosResponse<CaptureSetting[], unknown>> {
    return axios.get(`/projects/${projectName}/capture/settings/`)
  }

  async get(
    projectName: string,
    settingName: string
  ): Promise<AxiosResponse<CaptureSetting, unknown>> {
    return axios.get(`/projects/${projectName}/capture/settings/${settingName}`)
  }

  async update(
    projectName: string,
    settingName: string,
    settings: CaptureSettingUpdate
  ): Promise<AxiosResponse<CaptureSetting, unknown>> {
    return axios.put(`/projects/${projectName}/capture/settings/${settingName}`, settings)
  }

  async delete(
    projectName: string,
    settingName: string
  ): Promise<AxiosResponse<CaptureSetting, unknown>> {
    return axios.delete(`/projects/${projectName}/capture/settings/${settingName}`)
  }
}

const captureSettingsService = new CaptureSettingsService()
export default captureSettingsService
