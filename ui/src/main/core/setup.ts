/**
 * @module core/setup
 * @description Initializes the application setup, including creating necessary directories.
 */

import { getMainAppPath, getPluginBasePath, getPreferencesPath } from "./appPaths"
import fs from "fs"

const pluginsPath = getPluginBasePath()
if (!fs.existsSync(pluginsPath)) {
  fs.mkdirSync(pluginsPath, { recursive: true })
}

const mainPath = getMainAppPath()
if (!fs.existsSync(mainPath)) {
  fs.mkdirSync(mainPath, { recursive: true })
}

const preferencesPath = getPreferencesPath()
if (!fs.existsSync(preferencesPath)) {
  fs.writeFileSync(preferencesPath, JSON.stringify({}), "utf-8")
}
