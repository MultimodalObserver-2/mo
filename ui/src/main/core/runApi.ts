/**
 * @module core/runApi
 * @description Provides functions to run the API server and check its readiness.
 */

import http from "http"
import { spawn } from "child_process"
import { ipcMain } from "electron"
import net from "net"
import { join } from "path"

function getFreePort() {
  return new Promise((resolve, reject) => {
    const server = net.createServer()
    server.unref()
    server.on("error", reject)
    server.listen(0, () => {
      const port = (server.address() as net.AddressInfo).port
      server.close(() => resolve(port))
    })
  })
}

export async function runApi() {
  try {
    const apiPort = (await getFreePort()) as number
    const apiName = "mo_api" + (process.platform === "win32" ? ".exe" : "")
    const apiPath = join(process.resourcesPath, apiName)
    const apiProcess = spawn(apiPath, [], {
      detached: true,
      env: {
        ...process.env,
        API_PORT: apiPort.toString()
      }
    })

    ipcMain.handle("core:get-api-port", async () => apiPort)
    return { apiProcess, apiPort }
  } catch (error) {
    console.error("Error getting free port:", error)
    return { apiProcess: null, apiPort: null }
  }
}

export function waitForApiReady(url: string, timeout = 40000, interval = 500): Promise<void> {
  return new Promise((resolve, reject) => {
    const startTime = Date.now()

    const check = () => {
      http
        .get(url, (res) => {
          if (res.statusCode === 200) {
            resolve()
          } else {
            retry()
          }
        })
        .on("error", retry)
    }

    const retry = () => {
      if (Date.now() - startTime > timeout) {
        reject(new Error("API did not start in time"))
      } else {
        setTimeout(check, interval)
      }
    }

    check()
  })
}
