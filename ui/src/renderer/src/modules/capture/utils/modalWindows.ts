/**
 * @module modalWindows
 * This file contains utility functions for opening modal windows related to
 * data capture sources and session details. These helpers abstract the
 * `window.core.openModalWindow` API call for common capture-related UI flows.
 */

export function openCaptureSourceModal(projectName: string) {
  window.core.openModalWindow({
    options: {
      width: 550,
      minWidth: 550,
      minHeight: 235,
      title: "Capture sources",
      webPreferences: {
        webSecurity: false,
        allowRunningInsecureContent: true
      }
    },
    endpoint: `capture/select-source/${projectName}`,
    autoAdjustHeight: {
      elementId: "modal-body",
      extraHeight: 165,
      errorHeight: 250,
      setMinimumSize: true
    }
  })
}

export function openConfigureCaptureSourceModal(projectName: string, pluginId: string) {
  window.core.openModalWindow({
    options: { width: 550, minWidth: 550, minHeight: 250, title: "Configure plugin" },
    endpoint: `capture/${projectName}/sources/${pluginId}`,
    autoAdjustHeight: {
      elementId: "submit-config",
      extraHeight: 165,
      errorHeight: 250,
      setMinimumSize: true
    }
  })
}

export function openUpdateCaptureSourceModal(projectName: string, configName: string) {
  window.core.openModalWindow({
    options: { width: 550, minWidth: 550, minHeight: 250, title: "Configure plugin" },
    endpoint: `capture/${projectName}/configs/${configName}`,
    autoAdjustHeight: {
      elementId: "submit-config",
      extraHeight: 165,
      errorHeight: 250,
      setMinimumSize: true
    }
  })
}

export function openSessionDetailsModal(
  projectName: string,
  participantCode: string,
  sessionId: string
) {
  window.core.openModalWindow({
    options: { width: 800, minWidth: 750, minHeight: 400, title: "Session Information" },
    endpoint: `capture/${projectName}/participants/${participantCode}/sessions/${sessionId}`,
    autoAdjustHeight: {
      elementId: "modal-body",
      extraHeight: 140,
      errorHeight: 400,
      setMinimumSize: true
    }
  })
}
