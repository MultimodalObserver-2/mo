import { app, ipcMain } from "electron"
import extract from "extract-zip"
import { tmpdir } from "os"
import path from "path"
import fs from "fs"

app.whenReady().then(() => {
  ipcMain.handle("core:zip:extract", async (_, buffer: ArrayBuffer, destPath: string) => {
    try {
      const tmpZipPath = path.join(tmpdir(), `file.zip`)
      fs.writeFileSync(tmpZipPath, Buffer.from(buffer))

      await extract(tmpZipPath, { dir: destPath })
      fs.unlinkSync(tmpZipPath) // Clean up the temporary zip file
      return { success: true }
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : String(error) }
    }
  })
})
