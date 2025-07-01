import { is } from "@electron-toolkit/utils"
import { app, BrowserWindow, dialog, ipcMain, screen } from "electron"
import { join } from "path"
import { broadcast, getApiPort } from "../.."
import EventEmitter from "events"

type ProtocolExecMsg = {
  activity_name: string
  activity_num: number
  message: string
  message_type: string
  total_activities: number
  has_time_limit: boolean
  show_timer: boolean
}

const events = new EventEmitter()

function showMessageWindow(name: string, message: string, buttons: string[]): Promise<number> {
  return new Promise((resolve) => {
    const msgWin = new BrowserWindow({
      width: 350,
      height: 115,
      minWidth: 350,
      minHeight: 115,
      x: 0,
      y: 0,
      frame: false,
      alwaysOnTop: true,
      autoHideMenuBar: true,
      show: false,
      title: `Activity: ${name}`,
      webPreferences: {
        preload: join(__dirname, "../preload/index.js"),
        sandbox: false
      }
    })

    const buttons_string = buttons.join(",")
    const endpoint = `organization/activity-message/${name}?message=${encodeURIComponent(message)}&button=${buttons_string}`
    if (is.dev && process.env["ELECTRON_RENDERER_URL"]) {
      msgWin.loadURL(`${process.env["ELECTRON_RENDERER_URL"]}/#/${endpoint}`)
    } else {
      msgWin.loadFile(join(__dirname, "../renderer/index.html"), {
        hash: "#" + endpoint
      })
    }

    events.once("close-message-window", () => {
      ipcMain.removeAllListeners("organization:activity-message:button-clicked")
      ipcMain.removeAllListeners("organization:activity-message:set-height")
      resolve(-1)
      msgWin.destroy()
    })

    msgWin.once("ready-to-show", () => msgWin.show())
    ipcMain.on("organization:activity-message:button-clicked", (_event, idx) => {
      ipcMain.removeAllListeners("activity-message:button-clicked")
      resolve(idx)
      msgWin.destroy()
    })

    ipcMain.once("organization:activity-message:set-height", (event, height) => {
      const win = BrowserWindow.fromWebContents(event.sender)
      if (win) {
        const currentContentWidth = win.getContentBounds().width
        const newHeight = parseInt(height)
        win.setContentSize(currentContentWidth, newHeight, true)
        if (!win.isVisible()) {
          win.show()
        }
      }
    })

    msgWin.on("closed", () => {
      ipcMain.removeAllListeners("organization:activity-message:set-height")
      ipcMain.removeAllListeners("organization:activity-message:button-clicked")
      resolve(-1)
    })
  })
}

function createTimerWindow() {
  const { width, height } = screen.getPrimaryDisplay().workAreaSize
  const winWidth = 200
  const winHeight = 60
  const x = width - winWidth
  const y = height - winHeight

  const win = new BrowserWindow({
    width: winWidth,
    height: winHeight,
    minWidth: winWidth,
    minHeight: winHeight,
    x: x,
    y: y,
    frame: false,
    alwaysOnTop: true,
    autoHideMenuBar: true,
    resizable: false,
    show: false,
    title: "Timer",
    webPreferences: {
      preload: join(__dirname, "../preload/index.js"),
      sandbox: false
    }
  })

  const endpoint = `organization/activity-timer`
  if (is.dev && process.env["ELECTRON_RENDERER_URL"]) {
    win.loadURL(`${process.env["ELECTRON_RENDERER_URL"]}/#/${endpoint}`)
  } else {
    win.loadFile(join(__dirname, "../renderer/index.html"), {
      hash: "#" + endpoint
    })
  }

  return win
}

app.whenReady().then(() => {
  let isProtocolRunning = false
  let protocolProjectName: string | null = null
  let protocolNameStatus: string | null = null
  let socket: WebSocket | null = null
  ipcMain.on("organization:exec-protocol", async (_event, projectName, protocolName) => {
    if (isProtocolRunning) {
      dialog.showErrorBox(
        "Protocol Execution Error",
        "A protocol is already running. Please finish the current protocol before starting a new one."
      )
      return
    }
    let API_PORT: string | number
    if (is.dev) {
      API_PORT = import.meta.env.VITE_DEV_API_PORT || "8000"
    } else {
      API_PORT = getApiPort() ?? 8000
    }

    socket = new WebSocket(
      `ws://localhost:${API_PORT}/projects/${projectName}/protocols/${protocolName}/execute`
    )
    const timerWindow = createTimerWindow()

    socket.onopen = () => {
      isProtocolRunning = true
      protocolProjectName = projectName
      protocolNameStatus = protocolName
    }

    socket.onclose = () => {
      events.emit("close-message-window")
      isProtocolRunning = false
      protocolProjectName = null
      protocolNameStatus = null
      timerWindow.destroy()
      broadcast("organization:on-exec-protocol-finished")
    }

    socket.onerror = () => {
      isProtocolRunning = false
      protocolProjectName = null
      protocolNameStatus = null
      timerWindow.destroy()
      dialog.showErrorBox(
        "Protocol Execution Error",
        "An error occurred while executing the protocol."
      )
    }

    socket.onmessage = async (event) => {
      const data: ProtocolExecMsg = JSON.parse(event.data)
      const stopTimer = () => {
        if (data.show_timer) {
          timerWindow.webContents.send("organization:on-activity-timer-stop")
          timerWindow.hide()
        }
      }

      const showTimer = () => {
        if (data.show_timer) {
          timerWindow.show()
        }
      }

      const startTimer = () => {
        if (data.show_timer) {
          timerWindow.webContents.send("organization:on-activity-timer-start", 0)
          timerWindow.show()
        }
      }

      const handleCompleteActivity = async () => {
        startTimer()
        const completeResponse = await showMessageWindow(data.activity_name, data.message, [
          "Completed"
        ])
        if (completeResponse === 0) {
          stopTimer()
          socket?.send("completed")
        }
      }

      if (data.message_type === "start") {
        const startResponse = await showMessageWindow(data.activity_name, data.message, ["Start"])
        if (startResponse === 0) {
          socket?.send("start")
          showTimer()
          if (!data.has_time_limit) {
            await handleCompleteActivity()
          }
        }
      }

      if (data.message_type === "end") {
        const button = data.total_activities === data.activity_num ? "Finish" : "Next"
        const endResponse = await showMessageWindow(data.activity_name, data.message, [button])
        if (endResponse === 0) {
          stopTimer()
          socket?.send("next")
        }
      }

      if (data.show_timer && data.message_type === "timer") {
        timerWindow.webContents.send(
          "organization:on-activity-timer-change",
          parseInt(data.message)
        )
      }

      if (data.message_type === "finish") {
        socket?.close()
        isProtocolRunning = false
      }
    }
  })

  ipcMain.on("organization:stop-protocol-execution", () => {
    if (socket) {
      socket.close()
    }
  })

  ipcMain.handle("organization:get-protocol-execution-status", () => {
    return {
      isRunning: isProtocolRunning,
      projectName: protocolProjectName,
      protocolName: protocolNameStatus
    }
  })
})
