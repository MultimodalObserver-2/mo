import axios from "@renderer/core/lib/axios"
import { Plugin } from "@renderer/core/types/Plugin"
import { AxiosResponse } from "axios"

class CaptureService {
  readonly endpoint = "/capture"

  async getPlugins(): Promise<AxiosResponse<Plugin[], unknown>> {
    return axios.get(`${this.endpoint}/plugins`)
  }
}

const captureService = new CaptureService()
export default captureService
