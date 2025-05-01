import { is } from "@electron-toolkit/utils"
import { app, BrowserWindow, ipcMain } from "electron"
import { join } from "path"

const modalWindows: Map<string, BrowserWindow> = new Map()

function createModalWindow(
  options: Electron.BrowserWindowConstructorOptions,
  endpoint: string,
  parent: string,
  child?: string
): BrowserWindow {
  options.show = false
  options.autoHideMenuBar = true
  options.webPreferences = {
    preload: join(__dirname, "../preload/index.js"),
    sandbox: false
  }
  const win = new BrowserWindow(options)

  if (is.dev && process.env["ELECTRON_RENDERER_URL"]) {
    win.loadURL(`${process.env["ELECTRON_RENDERER_URL"]}/#/${endpoint}`)
  } else {
    win.loadFile(join(__dirname, "../renderer/index.html"), {
      hash: "#" + endpoint
    })
  }

  win.once("ready-to-show", () => modalWindows.get(parent)?.show())
  if (child) {
    win.on("close", () => {
      if (modalWindows.has(child)) {
        const childWindow = modalWindows.get(child)
        childWindow?.close()
      }
    })
  }

  win.on("closed", () => {
    modalWindows.delete(parent)
  })

  return win
}

interface OpenModalWindow {
  options: Electron.BrowserWindowConstructorOptions
  endpoint: string
  parent?: string
  child?: string
}

app.whenReady().then(() => {
  ipcMain.on(
    "core:open-modal-window",
    (_event, { options, endpoint, parent = "main", child }: OpenModalWindow) => {
      if (modalWindows.has(parent)) {
        const modalWindow = modalWindows.get(parent)
        modalWindow?.once("closed", () => {
          modalWindows.set(parent, createModalWindow(options, endpoint, parent, child))
        })
        modalWindow?.close()
      } else {
        modalWindows.set(parent, createModalWindow(options, endpoint, parent, child))
      }
    }
  )
})
