import { BrowserWindow } from "electron"
import preferencesManager from "./PreferencesManager"

export const WINDOW_STATE_KEY = "windowState"

export type WindowState = {
  x?: number
  y?: number
  width?: number
  height?: number
  maximized?: boolean
}

export function saveWindowState(window: BrowserWindow): void {
  const bounds = window.getBounds()
  const state: WindowState = {
    x: bounds.x,
    y: bounds.y,
    width: bounds.width,
    height: bounds.height,
    maximized: window.isMaximized()
  }
  preferencesManager.set(WINDOW_STATE_KEY, state)
}

export function loadWindowState(): WindowState | null {
  const state = preferencesManager.get<WindowState>(WINDOW_STATE_KEY)
  return state ?? null
}
