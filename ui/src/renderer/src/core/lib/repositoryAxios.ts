/**
 * @module repositoryAxios
 * Exports a preconfigured Axios instance for the external plugin repository API.
 * The base URL is read from VITE_REPOSITORY_API_URL or falls back to the default.
 * It can be updated at runtime via `repositoryAxios.defaults.baseURL`.
 */
import axios from "axios"

export const DEFAULT_REPOSITORY_URL =
  import.meta.env.VITE_REPOSITORY_API_URL || "http://localhost:8001/api/v1/plugins"

export default axios.create({
  baseURL: DEFAULT_REPOSITORY_URL,
  headers: { "Content-type": "application/json" }
})
