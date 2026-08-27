/**
 * @module core/plugins
 * @description Provides functionality plugin related operations
 */

import { app, BrowserWindow, ipcMain } from "electron"
import https from "https"

/**
 * Whether some window already took charge of the startup update check.
 *
 * The renderer cannot hold this flag: every window — the main one and each modal — loads
 * `renderer/index.html` again and mounts its own React tree, so any ref living there starts
 * fresh. The main process is the only state shared across windows.
 */
let updateCheckClaimed = false

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

  // Hands the startup update check to the first window that asks and denies it to the rest, so
  // opening a modal neither re-queries the repository nor raises a second notification.
  ipcMain.handle("core:plugin:claim-update-check", () => {
    if (updateCheckClaimed) return false
    updateCheckClaimed = true
    return true
  })
})
