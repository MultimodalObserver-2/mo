import { app, MenuItemConstructorOptions } from "electron"
import { apiClient } from "../../core/apiClient"
import { broadcast, getSystemTray } from "../.."
import hotkeysManager from "../../core/hotkeys/HotkeysManager"

type CaptureEvent = "startCapture" | "stopCapture"
type CaptureCallback = (projectName?: string | null, participantCode?: string | null) => void

export class CaptureSystemTray {
  private isBusy = false
  private isCapturing = false
  private isPaused = false
  private projectName: string | null = null
  private participantCode: string | null = null

  private listeners: { [K in CaptureEvent]: Set<CaptureCallback> } = {
    startCapture: new Set(),
    stopCapture: new Set()
  }

  constructor() {
    if (app.isReady()) {
      this.initialize()
    } else {
      app.on("ready", () => {
        this.initialize()
      })
    }
  }

  private initialize() {
    this.updateMenu()
    hotkeysManager.registerAction({
      type: "complementary",
      action: {
        id: "capture.startStop",
        actions: [
          {
            id: "capture.start",
            label: "Start Capture",
            callback: () => this.startCapture()
          },
          {
            id: "capture.stop",
            label: "Stop Capture",
            callback: () => this.stopCapture()
          }
        ],
        getState: () => (this.isCapturing ? 1 : 0)
      }
    })
    hotkeysManager.registerAction({
      type: "complementary",
      action: {
        id: "capture.pauseResume",
        actions: [
          {
            id: "capture.pause",
            label: "Pause Capture",
            callback: () => this.pauseCapture()
          },
          {
            id: "capture.resume",
            label: "Resume Capture",
            callback: () => this.resumeCapture()
          }
        ],
        getState: () => (this.isPaused ? 1 : 0)
      }
    })
  }

  private notifyRenderer() {
    broadcast("capture:on-change-status", {
      isCapturing: this.isCapturing,
      isPaused: this.isPaused
    })
  }

  public setProject(projectName: string | null) {
    this.projectName = projectName
    this.updateMenu()
  }

  public setParticipant(participantCode: string | null) {
    this.participantCode = participantCode
    this.updateMenu()
  }

  public updateStatusFromRenderer(isCapturing: boolean, isPaused: boolean) {
    const wasCapturing = this.isCapturing
    this.isCapturing = isCapturing
    this.isPaused = isPaused
    this.updateMenu()

    if (!wasCapturing && isCapturing) {
      this.emit("startCapture")
    } else if (wasCapturing && !isCapturing) {
      this.emit("stopCapture")
    }
  }

  public onStartCapture(callback: CaptureCallback): () => void {
    this.listeners.startCapture.add(callback)
    return () => this.listeners.startCapture.delete(callback)
  }

  public onStopCapture(callback: CaptureCallback): () => void {
    this.listeners.stopCapture.add(callback)
    return () => this.listeners.stopCapture.delete(callback)
  }

  private emit(event: CaptureEvent) {
    for (const cb of this.listeners[event]) {
      try {
        cb(this.projectName, this.participantCode)
      } catch (e) {
        console.error(`CaptureSystemTray event error (${event}):`, e)
      }
    }
  }

  private async startCapture() {
    if (this.isBusy || !this.projectName || !this.participantCode) return
    this.isBusy = true
    this.updateMenu()
    try {
      await apiClient.post("/capture/start", {
        project_name: this.projectName,
        participant_code: this.participantCode
      })
      this.isCapturing = true
      this.isPaused = false
      this.notifyRenderer()
      this.emit("startCapture")
    } catch (e) {
      console.error("Failed to start capture:", e)
    } finally {
      this.isBusy = false
      this.updateMenu()
    }
  }

  private async stopCapture() {
    if (this.isBusy) return
    this.isBusy = true
    this.updateMenu()
    try {
      await apiClient.post("/capture/stop")
      this.isCapturing = false
      this.isPaused = false
      this.notifyRenderer()
      this.emit("stopCapture")
    } catch (e) {
      console.error("Failed to stop capture:", e)
    } finally {
      this.isBusy = false
      this.updateMenu()
    }
  }

  private async pauseCapture() {
    if (this.isBusy) return
    this.isBusy = true
    this.updateMenu()
    try {
      await apiClient.post("/capture/pause")
      this.isPaused = true
      this.notifyRenderer()
    } catch (e) {
      console.error("Failed to pause capture:", e)
    } finally {
      this.isBusy = false
      this.updateMenu()
    }
  }

  private async resumeCapture() {
    if (this.isBusy) return
    this.isBusy = true
    this.updateMenu()
    try {
      await apiClient.post("/capture/resume")
      this.isPaused = false
      this.notifyRenderer()
    } catch (e) {
      console.error("Failed to resume capture:", e)
    } finally {
      this.isBusy = false
      this.updateMenu()
    }
  }

  private updateMenu() {
    const items: MenuItemConstructorOptions[] = [
      {
        id: "startStop",
        label: this.isCapturing ? "Stop Capture" : "Start Capture",
        click: this.isCapturing ? () => this.stopCapture() : () => this.startCapture(),
        enabled: this.isCapturing || (!!this.projectName && !!this.participantCode && !this.isBusy)
      },
      {
        id: "pauseResume",
        label: this.isPaused ? "Resume Capture" : "Pause Capture",
        click: this.isPaused ? () => this.resumeCapture() : () => this.pauseCapture(),
        enabled: this.isCapturing && !this.isBusy,
        visible: this.isCapturing
      },
      { type: "separator" }
    ]

    getSystemTray()?.extendContextMenu(items)
  }
}

export const captureTray = new CaptureSystemTray()
