import { is } from "@electron-toolkit/utils"
import { BrowserWindow, dialog, ipcMain, IpcMainEvent, screen } from "electron"
import { join } from "path"
import { broadcast, getApiPort } from "../.."
import EventEmitter from "events"
import i18n from "../../core/i18n/i18n"

type ProtocolExecMsg = {
  activity_name: string
  activity_num: number
  message: string
  message_type: string
  total_activities: number
  has_time_limit: boolean
  show_timer: boolean
}

const t = i18n.getFixedT(null, "organization")

export class ProtocolExecution extends EventEmitter {
  private isProtocolRunning = false
  private protocolProjectName: string | null = null
  private protocolNameStatus: string | null = null
  private socket: WebSocket | null = null
  private timerWindow: BrowserWindow | null = null

  public async start(projectName: string, protocolName: string): Promise<boolean> {
    if (this.isProtocolRunning) {
      dialog.showErrorBox(
        t("dialogs.errors.protocolExecution.title"),
        t("dialogs.errors.protocolExecution.description")
      )
      return false
    }
    let API_PORT: string | number
    if (is.dev) {
      API_PORT = import.meta.env.VITE_DEV_API_PORT || "8000"
    } else {
      API_PORT = getApiPort() ?? 8000
    }

    this.socket = new WebSocket(
      `ws://localhost:${API_PORT}/projects/${projectName}/protocols/${protocolName}/execute`
    )
    this.timerWindow = this.createTimerWindow()

    this.socket.onopen = () => {
      this.isProtocolRunning = true
      this.protocolProjectName = projectName
      this.protocolNameStatus = protocolName
      this.emit("started")
      broadcast("organization:on-exec-protocol-started", {
        projectName,
        protocolName
      })
    }

    this.socket.onclose = () => {
      this.emit("close-message-window")
      this.isProtocolRunning = false
      this.protocolProjectName = null
      this.protocolNameStatus = null
      this.timerWindow?.destroy()
      this.emit("finished")
      broadcast("organization:on-exec-protocol-finished")
    }

    this.socket.onerror = () => {
      this.isProtocolRunning = false
      this.protocolProjectName = null
      this.protocolNameStatus = null
      this.timerWindow?.destroy()
      dialog.showErrorBox(
        t("dialogs.errors.protocolExecution.title"),
        t("dialogs.errors.protocolExecution.onError")
      )
      this.emit("error")
    }

    this.socket.onmessage = async (event) => {
      const data: ProtocolExecMsg = JSON.parse(event.data)
      const stopTimer = () => {
        if (data.show_timer && this.timerWindow) {
          this.timerWindow.webContents.send("organization:on-activity-timer-stop")
          this.timerWindow.hide()
        }
      }

      const showTimer = () => {
        if (data.show_timer && this.timerWindow) {
          this.timerWindow.show()
        }
      }

      const startTimer = () => {
        if (data.show_timer && this.timerWindow) {
          this.timerWindow.webContents.send("organization:on-activity-timer-start", 0)
          this.timerWindow.show()
        }
      }

      const handleCompleteActivity = async () => {
        startTimer()
        const completeResponse = await this.showMessageWindow(data.activity_name, data.message, [
          t("dialogs.buttons.completed")
        ])
        if (completeResponse === 0) {
          stopTimer()
          this.socket?.send("completed")
        }
      }

      if (data.message_type === "start") {
        const startResponse = await this.showMessageWindow(data.activity_name, data.message, [
          t("dialogs.buttons.start")
        ])
        if (startResponse === 0) {
          this.socket?.send("start")
          showTimer()
          if (!data.has_time_limit) {
            await handleCompleteActivity()
          }
        }
      }

      if (data.message_type === "end") {
        const button =
          data.total_activities === data.activity_num
            ? t("dialogs.buttons.finish")
            : t("dialogs.buttons.next")
        const endResponse = await this.showMessageWindow(data.activity_name, data.message, [button])
        if (endResponse === 0) {
          stopTimer()
          this.socket?.send("next")
        }
      }

      if (data.show_timer && data.message_type === "timer") {
        this.timerWindow?.webContents.send(
          "organization:on-activity-timer-change",
          parseInt(data.message)
        )
      }

      if (data.message_type === "finish") {
        this.socket?.close()
        this.isProtocolRunning = false
      }
    }
    return true
  }

  public stop() {
    if (this.socket) {
      this.socket.close()
      this.socket = null
    }
  }

  public getStatus() {
    return {
      isRunning: this.isProtocolRunning,
      projectName: this.protocolProjectName,
      protocolName: this.protocolNameStatus
    }
  }

  private createTimerWindow() {
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
      title: t("modals.timerTitle"),
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

  private showMessageWindow(name: string, message: string, buttons: string[]): Promise<number> {
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
        title: t("modals.activityTitle", { name }),
        webPreferences: {
          preload: join(__dirname, "../preload/index.js"),
          sandbox: false
        }
      })

      const buttons_string = buttons.join(",")
      const endpoint = `organization/activity-message/${name}?message=${encodeURIComponent(
        message
      )}&button=${buttons_string}`
      if (is.dev && process.env["ELECTRON_RENDERER_URL"]) {
        msgWin.loadURL(`${process.env["ELECTRON_RENDERER_URL"]}/#/${endpoint}`)
      } else {
        msgWin.loadFile(join(__dirname, "../renderer/index.html"), {
          hash: "#" + endpoint
        })
      }

      this.once("close-message-window", () => {
        resolve(-1)
        msgWin.destroy()
      })

      msgWin.once("ready-to-show", () => msgWin.show())

      const onButtonClicked = (_event: IpcMainEvent, idx: number) => {
        resolve(idx)
        msgWin.destroy()
      }
      const onSetHeight = (event: IpcMainEvent, height: number) => {
        const win = BrowserWindow.fromWebContents(event.sender)
        if (win) {
          const currentContentWidth = win.getContentBounds().width
          const newHeight = parseInt(String(height))
          win.setContentSize(currentContentWidth, newHeight, true)
          if (!win.isVisible()) {
            win.show()
          }
        }
      }

      ipcMain.once("organization:activity-message:button-clicked", onButtonClicked)
      ipcMain.once("organization:activity-message:set-height", onSetHeight)

      msgWin.on("closed", () => {
        ipcMain.removeListener("organization:activity-message:button-clicked", onButtonClicked)
        ipcMain.removeListener("organization:activity-message:set-height", onSetHeight)
        resolve(-1)
      })
    })
  }
}

const protocolExecution = new ProtocolExecution()
export default protocolExecution
