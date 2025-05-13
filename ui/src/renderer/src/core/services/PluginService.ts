import axios from "../lib/axios"

class PluginService {
  readonly endpoint = "/plugins"

  async register(pluginFile: File): Promise<unknown> {
    const formData = new FormData()
    formData.append("file", pluginFile)

    return axios.post(`${this.endpoint}/`, formData, {
      headers: {
        "Content-Type": "multipart/form-data"
      }
    })
  }
}

const pluginService = new PluginService()
export default pluginService
