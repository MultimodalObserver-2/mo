import { app, MenuItemConstructorOptions } from "electron"
import { apiClient } from "../../core/apiClient"
import { broadcast, getSystemTray } from "../.."
import hotkeysManager from "../../core/hotkeys/HotkeysManager"
import i18n from "i18next"
import languageObserver from "../../core/i18n/LanguageObserver"
const tCaptureTray = i18n.getFixedT(null, "capture", "tray")
const tCaptureHotkeys = i18n.getFixedT(null, "capture", "hotkeys")

type CaptureEvent = "startCapture" | "stopCapture"
type CaptureCallback = (projectName?: string | null, participantCode?: string | null) => void

export class CaptureSystemTray {
  private isBusy = false
  private isCapturing = false
  private isPaused = false
  private projectName: string | null = null
  private participantCode: string | null = null

  private readonly listeners: { [K in CaptureEvent]: Set<CaptureCallback> } = {
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

    languageObserver.subscribe(() => {
      this.updateMenu()
      this.updateHotkeys()
    })
  }

  private initialize() {
    this.updateMenu()
    this.registerHotkeys()
  }

  private updateHotkeys() {
    hotkeysManager.updateLabel("capture.start", tCaptureHotkeys("Start Capture", { ns: "capture" }))
    hotkeysManager.updateLabel("capture.stop", tCaptureHotkeys("Stop Capture", { ns: "capture" }))
    hotkeysManager.updateLabel("capture.pause", tCaptureHotkeys("Pause Capture", { ns: "capture" }))
    hotkeysManager.updateLabel(
      "capture.resume",
      tCaptureHotkeys("Resume Capture", { ns: "capture" })
    )
  }

  private registerHotkeys() {
    hotkeysManager.registerAction({
      type: "complementary",
      action: {
        id: "capture.startStop",
        actions: [
          {
            id: "capture.start",
            label: tCaptureHotkeys("Start Capture", { ns: "capture" }),
            callback: () => this.startCapture()
          },
          {
            id: "capture.stop",
            label: tCaptureHotkeys("Stop Capture", { ns: "capture" }),
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
            label: tCaptureHotkeys("Pause Capture", { ns: "capture" }),
            callback: () => this.pauseCapture()
          },
          {
            id: "capture.resume",
            label: tCaptureHotkeys("Resume Capture", { ns: "capture" }),
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
      isPaused: this.isPaused,
      isLoading: this.isBusy
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

  private async getCaptureStatus() {
    try {
      const response = await apiClient.get("/capture/status")
      this.isCapturing = response.data.started
      this.isPaused = response.data.paused
      this.updateMenu()
    } catch (e) {
      console.error("Failed to get capture status:", e)
    }
  }

  private async startCapture() {
    if (this.isBusy || !this.projectName || !this.participantCode) return
    this.isBusy = true
    this.notifyRenderer()
    this.updateMenu()
    try {
      await apiClient.post("/capture/start", {
        project_name: this.projectName,
        participant_code: this.participantCode
      })
      this.isCapturing = true
      this.isPaused = false
      this.emit("startCapture")
    } catch (e) {
      console.error("Failed to start capture:", e)
      this.getCaptureStatus()
    } finally {
      this.isBusy = false
      this.notifyRenderer()
      this.updateMenu()
    }
  }

  private async stopCapture() {
    if (this.isBusy) return
    this.isBusy = true
    this.emit("stopCapture")
    this.notifyRenderer()
    this.updateMenu()
    try {
      await apiClient.post("/capture/stop")
      this.isCapturing = false
      this.isPaused = false
    } catch (e) {
      console.error("Failed to stop capture:", e)
      this.getCaptureStatus()
    } finally {
      this.isBusy = false
      this.notifyRenderer()
      this.updateMenu()
    }
  }

  private async pauseCapture() {
    if (this.isBusy) return
    this.isBusy = true
    this.notifyRenderer()
    this.updateMenu()
    try {
      await apiClient.post("/capture/pause")
      this.isPaused = true
    } catch (e) {
      console.error("Failed to pause capture:", e)
      this.getCaptureStatus()
    } finally {
      this.isBusy = false
      this.notifyRenderer()
      this.updateMenu()
    }
  }

  private async resumeCapture() {
    if (this.isBusy) return
    this.isBusy = true
    this.notifyRenderer()
    this.updateMenu()
    try {
      await apiClient.post("/capture/resume")
      this.isPaused = false
    } catch (e) {
      console.error("Failed to resume capture:", e)
    } finally {
      this.isBusy = false
      this.notifyRenderer()
      this.updateMenu()
    }
  }

  private updateMenu() {
    const items: MenuItemConstructorOptions[] = [
      {
        id: "startStop",
        label: this.isCapturing ? tCaptureTray("Stop Capture") : tCaptureTray("Start Capture"),
        click: () => {
          if (this.isCapturing) {
            void this.stopCapture()
          } else {
            void this.startCapture()
          }
        },
        enabled: this.isCapturing || (!!this.projectName && !!this.participantCode && !this.isBusy)
      },
      {
        id: "pauseResume",
        label: this.isPaused ? tCaptureTray("Resume Capture") : tCaptureTray("Pause Capture"),
        click: () => {
          if (this.isPaused) {
            void this.resumeCapture()
          } else {
            void this.pauseCapture()
          }
        },
        enabled: this.isCapturing && !this.isBusy,
        visible: this.isCapturing
      },
      { type: "separator" }
    ]

    getSystemTray()?.extendContextMenu(items)
  }
}

export const captureTray = new CaptureSystemTray()
