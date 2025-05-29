import { AxiosResponse } from "axios"
import axios from "../lib/axios"
import { Plugin } from "../types/Plugin"
import { PluginProperty } from "../types/PluginProperty"

class PluginService {
  readonly endpoint = "/plugins"

  async register(pluginFile: File): Promise<AxiosResponse<Plugin, unknown>> {
    const formData = new FormData()
    formData.append("file", pluginFile)

    return axios.post(`${this.endpoint}/`, formData, {
      headers: {
        "Content-Type": "multipart/form-data"
      }
    })
  }

  async getAll(): Promise<AxiosResponse<Plugin[], unknown>> {
    return axios.get(`${this.endpoint}/`)
  }

  async get(id: string): Promise<AxiosResponse<Plugin, unknown>> {
    return axios.get(`${this.endpoint}/${id}`)
  }

  async delete(id: string): Promise<AxiosResponse<undefined, unknown>> {
    return axios.delete(`${this.endpoint}/${id}`)
  }

  async getSettingProperties(
    id: string,
    settings?: Record<string, unknown>
  ): Promise<AxiosResponse<PluginProperty[], unknown>> {
    return axios.get(`${this.endpoint}/${id}/settings/properties`, {
      params: settings
    })
  }
}

const pluginService = new PluginService()
export default pluginService
