import { app, shell, BrowserWindow, screen } from "electron"
import { join } from "path"
import { electronApp, optimizer, is } from "@electron-toolkit/utils"
import icon from "../../resources/icon.png?asset"
import { ChildProcess } from "child_process"
import treeKill from "tree-kill"

function createWindow(): BrowserWindow {
  const { width: screenWidth, height: screenHeight } = screen.getPrimaryDisplay().workAreaSize
  const height = Math.floor(screenHeight * 0.95)
  const width = Math.floor(height * (16 / 9))
  const adjustedWidth = Math.min(width, screenWidth)
  const adjustedHeight = Math.floor(adjustedWidth * (9 / 16))
  const minHeight = Math.floor(screenHeight * 0.8)
  const minWidth = Math.floor(minHeight * (4 / 3))
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width: adjustedWidth,
    height: adjustedHeight,
    minWidth: minWidth,
    minHeight: minHeight,
    show: false,
    autoHideMenuBar: true,
    title: "Multimodal Observer",
    ...(process.platform === "linux" ? { icon } : {}),
    webPreferences: {
      preload: join(__dirname, "../preload/index.js"),
      sandbox: false,
      webSecurity: !is.dev
    }
  })

  mainWindow.on("ready-to-show", () => {
    mainWindow.show()
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: "deny" }
  })

  mainWindow.on("close", () => {
    BrowserWindow.getAllWindows().forEach((window) => {
      if (window !== mainWindow) {
        window.close()
      }
    })
  })

  // Loading api process
  if (is.dev && process.env["ELECTRON_RENDERER_URL"]) {
    mainWindow.loadURL(process.env["ELECTRON_RENDERER_URL"])
  } else {
    mainWindow.loadFile(join(__dirname, "../renderer/index.html"), { hash: "#/loading" })
  }

  return mainWindow
}

let apiProcess: ChildProcess | null = null
let apiPort: number | null = null

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(async () => {
  // Set app user model id for windows
  electronApp.setAppUserModelId("com.multimodal-observer")

  // Default open or close DevTools by F12 in development
  // and ignore CommandOrControl + R in production.
  // see https://github.com/alex8088/electron-toolkit/tree/master/packages/utils
  app.on("browser-window-created", (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  if (!is.dev) {
    const apiInfo = await runApi()
    apiProcess = apiInfo.apiProcess
    apiPort = apiInfo.apiPort
  }

  const mainWindow = createWindow()

  app.on("activate", function () {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })

  if (!is.dev && apiPort) {
    try {
      await waitForApiReady(`http://localhost:${apiPort}/health`)
      mainWindow.loadFile(join(__dirname, "../renderer/index.html"))
    } catch (error) {
      console.error("API did not start in time:", error)
      mainWindow.loadFile(join(__dirname, "../renderer/index.html"), { hash: "#/error" })
    }
  }
})

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    if (!is.dev && apiProcess?.pid) {
      treeKill(apiProcess.pid)
    }
    app.quit()
  }
})

export function getApiPort(): number | null {
  return apiPort
}

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.
import "./core/index"
import "./modules/organization/index"
import "./modules/capture/index"
import "./modules/visualization/index"
import { runApi, waitForApiReady } from "./core/runApi"
