/**
 * @module core/plugins
 * @description Provides functionality plugin related operations
 */

import { app, BrowserWindow, ipcMain } from "electron"
import https from "https"

function downloadFromUrl(url: string): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const options = {
      headers: {
        Accept: "application/octet-stream",
        "User-Agent": "mo-app"
      }
    }

    const request = (targetUrl: string) => {
      https
        .get(targetUrl, options, (res) => {
          if ((res.statusCode === 301 || res.statusCode === 302) && res.headers.location) {
            request(res.headers.location)
            return
          }
          if (res.statusCode !== 200) {
            reject(new Error(`Download failed with status ${res.statusCode}`))
            return
          }
          const chunks: Buffer[] = []
          res.on("data", (chunk: Buffer) => chunks.push(chunk))
          res.on("end", () => resolve(Buffer.concat(chunks)))
          res.on("error", reject)
        })
        .on("error", reject)
    }

    request(url)
  })
}

app.whenReady().then(() => {
  ipcMain.on("core:reload-plugins", () => {
    BrowserWindow.getAllWindows().forEach((window) => {
      window.webContents.send("core:on-reload-plugins")
    })
  })

  ipcMain.handle(
    "core:plugin:download-asset",
    async (_event, assetId: number, repoPath: string) => {
      const url = `https://api.github.com/repos/${repoPath}/releases/assets/${assetId}`
      const buffer = await downloadFromUrl(url)
      return buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength)
    }
  )
})
