import { getPluginBasePath } from "./appPaths"
import fs from "fs"

const pluginsPath = getPluginBasePath()
if (!fs.existsSync(pluginsPath)) {
  fs.mkdirSync(pluginsPath, { recursive: true })
}
