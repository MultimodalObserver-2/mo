import axios from "@renderer/core/lib/axios"
import { AxiosResponse } from "axios"
import { CaptureSetting } from "../types/CaptureSetting"

class CaptureSettingsService {
  async addSettings(
    projectName: string,
    settingName: string,
    pluginName: string,
    settings: Record<string, unknown>
  ): Promise<AxiosResponse<CaptureSetting, unknown>> {
    return axios.post(`/projects/${projectName}/capture/settings/`, {
      name: settingName,
      plugin_name: pluginName,
      settings: settings
    })
  }

  async getAll(projectName: string): Promise<AxiosResponse<CaptureSetting[], unknown>> {
    return axios.get(`/projects/${projectName}/capture/settings/`)
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
