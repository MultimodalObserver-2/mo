/**
 * @module core/fs
 * @description Provides functions to interact with the file system, such as reading and writing files, checking existence, and directory operations.
 */

import { ipcMain, app } from "electron"
import fs from "fs"

app.whenReady().then(() => {
  ipcMain.handle("core:fs:readFileSync", async (_event, filePath: string, encoding = "utf-8") => {
    return fs.readFileSync(filePath, encoding)
  })

  ipcMain.handle("core:fs:writeFileSync", async (_event, filePath: string, content: string) => {
    return fs.writeFileSync(filePath, content, "utf-8")
  })

  ipcMain.handle("core:fs:readdirSync", async (_event, dirPath: string) => {
    return fs.readdirSync(dirPath)
  })

  ipcMain.handle("core:fs:existsSync", async (_event, filePath: string) => {
    return fs.existsSync(filePath)
  })

  ipcMain.handle(
    "core:fs:rmSync",
    async (_event, filePath: string, options?: { recursive?: boolean; force?: boolean }) => {
      return fs.rmSync(filePath, options)
    }
  )

  ipcMain.handle("core:fs:isDirectory", async (_event, filePath: string) => {
    return fs.statSync(filePath).isDirectory()
  })
})
