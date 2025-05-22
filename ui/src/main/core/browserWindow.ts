import { is } from "@electron-toolkit/utils"
import { app, BrowserWindow, dialog, ipcMain, screen } from "electron"
import { join } from "path"

const modalWindows: Map<string, BrowserWindow> = new Map()
const modalWindowsParents: Map<string, string> = new Map()

function createModalWindow(
  options: Electron.BrowserWindowConstructorOptions,
  endpoint: string,
  parent: string,
  name: string,
  autoAdjustHeight?: {
    elementId: string
    extraHeight?: number
    timeout?: number
  }
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

  if (autoAdjustHeight) {
    win.once("show", () => {
      setTimeout(() => {
        win.webContents
          .executeJavaScript(
            `
          (() => {
            const el = document.getElementById("${autoAdjustHeight.elementId}")
            if (el) {
              return {scrollHeight: el.scrollHeight, offsetHeight: el.offsetHeight, clientHeight: el.clientHeight}
            }
            return null
          })()
      `
          )
          .then((res) => {
            if (!res) {
              console.error(
                `ModalWindow_autoAdjustHeight: Element with id ${autoAdjustHeight.elementId} not found`
              )
              return
            }
            const { height: screenHeight } = screen.getPrimaryDisplay().workAreaSize
            const currentContentWidth = win.getContentBounds().width
            const height = res.scrollHeight + (autoAdjustHeight.extraHeight || 0)
            const adjustedHeight = Math.min(height, screenHeight)
            win.setSize(currentContentWidth, adjustedHeight, false)
          })
          .catch((error) => {
            console.error("Error executing JavaScript:", error)
          })
      }, autoAdjustHeight.timeout || 200)
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
  autoAdjustHeight?: {
    elementId: string
    extraHeight?: number
    timeout?: number
  }
  parent?: string
  name?: string
}

app.whenReady().then(() => {
  ipcMain.on(
    "core:open-modal-window",
    (
      _event,
      { options, endpoint, autoAdjustHeight, parent = "main", name = "child" }: OpenModalWindow
    ) => {
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
          const window = createModalWindow(options, endpoint, parent, name, autoAdjustHeight)
          modalWindowsParents.set(parent, name)
          modalWindows.set(name, window)
        })
        modalWindow?.close()
      } else {
        const window = createModalWindow(options, endpoint, parent, name, autoAdjustHeight)
        modalWindowsParents.set(parent, name)
        modalWindows.set(name, window)
      }
    }
  )
})
