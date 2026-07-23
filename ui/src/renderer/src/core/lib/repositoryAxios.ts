/**
 * @module repositoryAxios
 * Exports a preconfigured Axios instance for the external plugin repository API.
 * The base URL is built by `repositoryUrls` and can be rebuilt at runtime through
 * `repositoryAxios.defaults.baseURL`.
 */
import axios from "axios"
import { DEFAULT_REPOSITORY_HOST, buildBaseUrl } from "./repositoryUrls"

export default axios.create({
  baseURL: buildBaseUrl(DEFAULT_REPOSITORY_HOST),
  headers: { "Content-type": "application/json" }
})
