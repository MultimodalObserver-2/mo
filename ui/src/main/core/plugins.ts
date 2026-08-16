/**
 * @module core/plugins
 * @description Provides functionality plugin related operations
 */

import { app, BrowserWindow, ipcMain } from "electron"
import https from "https"

function downloadFromUrl(url: string, mainWindow: BrowserWindow | null): Promise<Buffer> {
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

          const totalSize = parseInt(res.headers["content-length"] || "0", 10)
          let downloadedSize = 0
          const chunks: Buffer[] = []

          res.on("data", (chunk: Buffer) => {
            chunks.push(chunk)
            downloadedSize += chunk.length

            if (mainWindow && totalSize > 0) {
              const progress = Math.round((downloadedSize / totalSize) * 100)
              mainWindow.webContents.send("download:progress", {
                progress,
                downloaded: downloadedSize,
                total: totalSize
              })
            }
          })
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

  ipcMain.handle("core:plugin:download-asset", async (event, url: string) => {
    const mainWindow = BrowserWindow.fromWebContents(event.sender)
    const buffer = await downloadFromUrl(url, mainWindow)
    return buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength)
  })
})
