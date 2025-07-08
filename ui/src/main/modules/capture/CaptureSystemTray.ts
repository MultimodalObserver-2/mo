import { MenuItemConstructorOptions } from "electron"
import { apiClient } from "../../core/apiClient"
import { broadcast, getSystemTray } from "../.."

export class CaptureSystemTray {
  private isBusy = false
  private isCapturing = false
  private isPaused = false
  private projectName: string | null = null
  private participantCode: string | null = null

  constructor() {
    this.updateMenu()
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
    this.isCapturing = isCapturing
    this.isPaused = isPaused
    this.updateMenu()
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
