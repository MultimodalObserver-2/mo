import axios from "axios"
import { getApiPort } from ".."
import { is } from "@electron-toolkit/utils"

const DEV_API_PORT = process.env.VITE_DEV_API_PORT ?? "8000"
let API_PORT: string | number = DEV_API_PORT
if (!is.dev) {
  API_PORT = getApiPort() ?? "8000"
}

const BASE_URL = `http://localhost:${API_PORT}/`

export const apiClient = axios.create({
  baseURL: BASE_URL,
  headers: {
    "Content-type": "application/json"
  }
})
