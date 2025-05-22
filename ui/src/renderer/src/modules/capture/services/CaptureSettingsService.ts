import axios from "@renderer/core/lib/axios"
import { AxiosResponse } from "axios"

class CaptureSettingsService {
  async addSettings(
    projectName: string,
    settingName: string,
    pluginName: string,
    settings: Record<string, unknown>
  ): Promise<AxiosResponse<unknown, unknown>> {
    return axios.post(`/projects/${projectName}/capture/settings/`, {
      name: settingName,
      plugin_name: pluginName,
      settings: settings
    })
  }
}

const captureSettingsService = new CaptureSettingsService()
export default captureSettingsService
