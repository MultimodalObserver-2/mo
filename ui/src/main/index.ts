import { app, shell, BrowserWindow, screen } from "electron"
import { join } from "path"
import { electronApp, optimizer, is } from "@electron-toolkit/utils"
import icon from "../../resources/icon.png?asset"
import { ChildProcess } from "child_process"
import treeKill from "tree-kill"
import { loadWindowState, saveWindowState } from "./core/preferences/windowState"
import { SystemTray } from "./core/SystemTray"
import optionsManager from "./core/preferences/OptionsManager"
import preferencesManager from "./core/preferences/PreferencesManager"
import { initI18n } from "./core/i18n/i18n"
import { runApi, waitForApiReady } from "./core/runApi"

let forceQuit = false
let apiProcess: ChildProcess | null = null
let apiPort: number | null = null
let mainWindow: BrowserWindow | null = null
let systemTray: SystemTray | null = null

function createWindow(): BrowserWindow {
  const { width: screenWidth, height: screenHeight } = screen.getPrimaryDisplay().workAreaSize
  const height = Math.floor(screenHeight * 0.95)
  const width = Math.floor(height * (16 / 9))
  const adjustedWidth = Math.min(width, screenWidth)
  const adjustedHeight = Math.floor(adjustedWidth * (9 / 16))
  const minHeight = Math.floor(screenHeight * 0.8)
  const minWidth = Math.floor(minHeight * (4 / 3))
  // Create the browser window.
  const windowState = loadWindowState()
  const mainWindow = new BrowserWindow({
    width: windowState?.width ?? adjustedWidth,
    height: windowState?.height ?? adjustedHeight,
    minWidth: minWidth,
    minHeight: minHeight,
    x: windowState?.x,
    y: windowState?.y,
    show: false,
    autoHideMenuBar: true,
    title: "Multimodal Observer",
    ...(process.platform === "linux" ? { icon } : {}),
    webPreferences: {
      preload: join(__dirname, "../preload/index.js"),
      sandbox: false,
      webSecurity: !is.dev,
      nodeIntegration: true
    }
  })

  mainWindow.on("ready-to-show", () => {
    mainWindow.show()
    if (windowState?.maximized) {
      mainWindow.maximize()
    }
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: "deny" }
  })

  mainWindow.on("close", (event) => {
    const minimizeToTray = optionsManager.get("minimizeToTrayOnClose")
    preferencesManager.save()
    saveWindowState(mainWindow)
    if (minimizeToTray && !forceQuit) {
      event.preventDefault()
      mainWindow.hide()
      return
    }

    BrowserWindow.getAllWindows().forEach((window) => {
      if (window !== mainWindow) {
        window.close()
      }
    })

    if (!is.dev && apiProcess?.pid) {
      treeKill(apiProcess.pid)
      apiProcess = null
    }
  })

  // Loading api process
  if (is.dev && process.env["ELECTRON_RENDERER_URL"]) {
    mainWindow.loadURL(process.env["ELECTRON_RENDERER_URL"])
  } else {
    mainWindow.loadFile(join(__dirname, "../renderer/index.html"), { hash: "#/loading" })
  }

  mainWindow.webContents.setWindowOpenHandler((details) => {
    const url = details.url
    const isInternal = url.includes("internal=true")
    if (isInternal) {
      // Allow internal links to be opened in the same window
      return {
        action: "allow",
        overrideBrowserWindowOptions: {
          autoHideMenuBar: true,
          title: "Multimodal Observer",
          webPreferences: {
            preload: join(__dirname, "../preload/index.js"),
            sandbox: false,
            webSecurity: !is.dev
          }
        }
      }
    }

    // Open external links in the default browser
    shell.openExternal(details.url)
    return { action: "deny" }
  })

  return mainWindow
}

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
  await initI18n()
  if (!is.dev) {
    const apiInfo = await runApi()
    apiProcess = apiInfo.apiProcess
    apiPort = apiInfo.apiPort
  }

  mainWindow = createWindow()

  app.on("activate", function () {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })

  // Create system tray
  systemTray = new SystemTray()

  // Register IPC handlers
  // This is where we can register IPC handlers for communication between main and renderer processes
  await import("./core/index")
  await import("./modules/organization/index")
  await import("./modules/capture/index")
  await import("./modules/visualization/index")

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
      treeKill(apiProcess.pid, (err) => {
        if (err) {
          console.error("Failed to kill API process:", err)
        } else {
          console.log("API process killed successfully")
        }
        app.quit()
      })
    } else {
      app.quit()
    }
  }
})

export function getApiPort(): number | null {
  return apiPort
}

export function getMainWindow(): BrowserWindow | null {
  return mainWindow
}

export function broadcast(channel: string, ...args: unknown[]): void {
  BrowserWindow.getAllWindows().forEach((window) => {
    window.webContents.send(channel, ...args)
  })
}

export function getSystemTray(): SystemTray | null {
  return systemTray
}

export function setForceQuit(value: boolean): void {
  forceQuit = value
}
