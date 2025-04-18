import { BrowserWindow, ipcMain } from "electron"
import { join } from "path"

let modalWindow: BrowserWindow | null = null

function createModalWindow(
  options: Electron.BrowserWindowConstructorOptions,
  endpoint: string
): BrowserWindow {
  options.show = false
  options.autoHideMenuBar = true
  options.webPreferences = {
    preload: join(__dirname, "../preload/index.js"),
    sandbox: false
  }
  const win = new BrowserWindow(options)

  win.loadURL(`${process.env["ELECTRON_RENDERER_URL"]}/${endpoint}`)

  win.once("ready-to-show", () => modalWindow?.show())
  win.on("closed", () => {
    modalWindow = null
  })

  return win
}

ipcMain.on("core:open-modal-window", (_event, { options, endpoint }) => {
  if (modalWindow) {
    modalWindow.once("closed", () => {
      modalWindow = createModalWindow(options, endpoint)
    })
    modalWindow.close()
  } else {
    modalWindow = createModalWindow(options, endpoint)
  }
})
