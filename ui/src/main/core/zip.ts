import { app, ipcMain } from "electron"
import extract from "extract-zip"
import { tmpdir } from "os"
import path from "path"
import fs from "fs"

app.whenReady().then(() => {
  const MAX_FILES = 10000
  const MAX_SIZE = 1000000000 // 1 GB
  const THRESHOLD_RATIO = 10

  ipcMain.handle("core:zip:extract", async (_, buffer: ArrayBuffer, destPath: string) => {
    try {
      const tmpZipPath = path.join(tmpdir(), `file.zip`)
      fs.writeFileSync(tmpZipPath, Buffer.from(buffer))

      let fileCount = 0
      let totalSize = 0
      await extract(tmpZipPath, {
        dir: destPath,
        onEntry: function (entry) {
          fileCount++
          if (fileCount > MAX_FILES) {
            throw Error("Reached max. number of files")
          }

          // The uncompressedSize comes from the zip headers, so it might not be trustworthy.
          // Alternatively, calculate the size from the readStream.
          const entrySize = entry.uncompressedSize
          totalSize += entrySize
          if (totalSize > MAX_SIZE) {
            throw Error("Reached max. size")
          }

          if (entry.compressedSize > 0) {
            const compressionRatio = entrySize / entry.compressedSize
            if (compressionRatio > THRESHOLD_RATIO) {
              throw Error("Reached max. compression ratio")
            }
          }
        }
      })
      fs.unlinkSync(tmpZipPath) // Clean up the temporary zip file
      return { success: true }
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : String(error) }
    }
  })
})
