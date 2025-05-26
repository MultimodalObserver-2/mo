import axios from "@renderer/core/lib/axios"
import { Plugin } from "@renderer/core/types/Plugin"
import { AxiosResponse } from "axios"
import { StartCaptureRequest } from "../types/Capture"

class CaptureService {
  readonly endpoint = "/capture"

  async getPlugins(): Promise<AxiosResponse<Plugin[], unknown>> {
    return axios.get(`${this.endpoint}/plugins`)
  }

  async startCapture(data: StartCaptureRequest): Promise<AxiosResponse<void, unknown>> {
    return axios.post(`${this.endpoint}/start`, data)
  }

  async stopCapture(): Promise<AxiosResponse<void, unknown>> {
    return axios.post(`${this.endpoint}/stop`)
  }

  async getStatus(): Promise<AxiosResponse<boolean, unknown>> {
    return axios.get(`${this.endpoint}/status`)
  }
}

const captureService = new CaptureService()
export default captureService
