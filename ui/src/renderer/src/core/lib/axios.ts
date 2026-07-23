/**
 * @module axios
 * Exports a preconfigured Axios instance with dynamic port selection
 * based on the environment (dev or prod). Used for making HTTP requests
 * to the application's API.
 */
import axios from "axios"

const DEV_API_PORT = import.meta.env.VITE_DEV_API_PORT || "8000"
let API_PORT: string | number = DEV_API_PORT
try {
  API_PORT = import.meta.env.DEV ? DEV_API_PORT : await window.core.prod.getApiPort()
} catch (error) {
  console.error("Error getting API port:", error)
}

const BASE_URL = `http://localhost:${API_PORT}/`

export { API_PORT }

export default axios.create({
  baseURL: BASE_URL,
  headers: {
    "Content-type": "application/json"
  }
})
