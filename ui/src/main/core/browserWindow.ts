import { is } from "@electron-toolkit/utils"
import { app, BrowserWindow, dialog, ipcMain } from "electron"
import { join } from "path"

const modalWindows: Map<string, BrowserWindow> = new Map()
const modalWindowsParents: Map<string, string> = new Map()

function createModalWindow(
  options: Electron.BrowserWindowConstructorOptions,
  endpoint: string,
  parent: string,
  name: string
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

  win.once("ready-to-show", () => modalWindows.get(name)?.show())
  modalWindows.get(parent)?.on("close", () => {
    win.close()
  })

  win.on("closed", () => {
    modalWindows.get(parent)?.removeAllListeners("close")
    modalWindowsParents.delete(parent)
    modalWindows.delete(name)
  })

  return win
}

interface OpenModalWindow {
  options: Electron.BrowserWindowConstructorOptions
  endpoint: string
  parent?: string
  name?: string
}

app.whenReady().then(() => {
  ipcMain.on(
    "core:open-modal-window",
    (_event, { options, endpoint, parent = "main", name = "child" }: OpenModalWindow) => {
      if (name === "main") {
        dialog.showErrorBox(
          "Dev Error",
          "Modal window name cannot be 'main'. Please use a different name."
        )
        return
      }

      const windowName = modalWindowsParents.get(parent)
      if (windowName) {
        const modalWindow = modalWindows.get(windowName)
        modalWindow?.once("closed", () => {
          const window = createModalWindow(options, endpoint, parent, name)
          modalWindowsParents.set(parent, name)
          modalWindows.set(name, window)
        })
        modalWindow?.close()
      } else {
        const window = createModalWindow(options, endpoint, parent, name)
        modalWindowsParents.set(parent, name)
        modalWindows.set(name, window)
      }
    }
  )
})
