import { AxiosResponse } from "axios"
import axios from "../lib/axios"
import { Plugin } from "../types/Plugin"

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

  async get(name: string): Promise<AxiosResponse<Plugin, unknown>> {
    return axios.get(`${this.endpoint}/${name}`)
  }

  async delete(name: string): Promise<AxiosResponse<undefined, unknown>> {
    return axios.delete(`${this.endpoint}/${name}`)
  }
}

const pluginService = new PluginService()
export default pluginService
