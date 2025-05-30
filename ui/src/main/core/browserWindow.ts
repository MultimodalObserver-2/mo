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
    errorHeight?: number
    setMinimumSize?: boolean
  }
): BrowserWindow {
  options.show = false
  options.autoHideMenuBar = true
  options.webPreferences = {
    ...options.webPreferences,
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
      win.webContents
        .executeJavaScript(
          `
          (() => {
            const el = document.getElementById("${autoAdjustHeight.elementId}")
            let lastHeight = 0
            const ro = new ResizeObserver((entries) => {
              const entry = entries[0]
              const newHeight = entry.target.scrollHeight
              if (newHeight === lastHeight) return
              lastHeight = newHeight
              window.electron.ipcRenderer.send("core:adjust-modal-height:${name}-${autoAdjustHeight.elementId}", newHeight)
            })

            if (el) {
              ro.observe(el)
              return {scrollHeight: el.scrollHeight}
            }
            else {
              const mo = new MutationObserver(() => {
                const el = document.getElementById("${autoAdjustHeight.elementId}")
                if (el) {
                  ro.observe(el)
                  mo.disconnect()
                }
              })
              mo.observe(document.body, { childList: true, subtree: true })
            }
            return null
          })()
      `
        )
        .then((res) => {
          const currentContentWidth = win.getContentBounds().width
          if (!res) {
            if (autoAdjustHeight.errorHeight) {
              win.setSize(currentContentWidth, autoAdjustHeight.errorHeight)
            }
            return
          }
          const { height: screenHeight } = screen.getPrimaryDisplay().workAreaSize
          const height = res.scrollHeight + (autoAdjustHeight.extraHeight || 0)
          const [actualWidth, actualHeight] = win.getSize()
          const minHeight = Math.min(height, screenHeight)
          const adjustedHeight = Math.max(minHeight, actualHeight)
          if (autoAdjustHeight.setMinimumSize) {
            win.setMinimumSize(options.minWidth || currentContentWidth, minHeight)
          }
          win.setSize(actualWidth, adjustedHeight, false)
        })
        .catch((error) => {
          console.error("Error executing JavaScript:", error)
        })
    })
  }

  if (autoAdjustHeight) {
    ipcMain.on(
      `core:adjust-modal-height:${name}-${autoAdjustHeight?.elementId}`,
      (event, height) => {
        const win = BrowserWindow.fromWebContents(event.sender)
        if (win) {
          const { height: screenHeight } = screen.getPrimaryDisplay().workAreaSize
          const currentContentWidth = win.getContentBounds().width
          const newHeight = parseInt(height) + (autoAdjustHeight?.extraHeight || 0)
          const [actualWidth, actualHeight] = win.getSize()
          const minHeight = Math.min(newHeight, screenHeight)
          const adjustedHeight = Math.max(minHeight, actualHeight)
          if (autoAdjustHeight.setMinimumSize) {
            win.setMinimumSize(options.minWidth || currentContentWidth, minHeight)
          }
          win.setSize(actualWidth, minHeight || adjustedHeight, false)
        }
      }
    )
  }

  win.once("ready-to-show", () => modalWindows.get(name)?.show())
  modalWindows.get(parent)?.on("close", () => {
    win.close()
  })

  win.on("closed", () => {
    modalWindows.get(parent)?.removeAllListeners("close")
    modalWindowsParents.delete(parent)
    modalWindows.delete(name)
    ipcMain.removeAllListeners(`core:adjust-modal-height:${name}-${autoAdjustHeight?.elementId}`)
  })

  return win
}

interface OpenModalWindow {
  options: Electron.BrowserWindowConstructorOptions
  endpoint: string
  autoAdjustHeight?: {
    elementId: string
    extraHeight?: number
    errorHeight?: number
    setMinimumSize?: boolean
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
