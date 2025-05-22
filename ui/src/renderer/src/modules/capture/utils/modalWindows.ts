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
      timeout: 500
    }
  })
}

export function openConfigureCaptureSourceModal(projectName: string, pluginName: string) {
  window.core.openModalWindow({
    options: { width: 550, minWidth: 550, minHeight: 250, title: "Configure plugin" },
    endpoint: `capture/${projectName}/sources/${pluginName}`,
    autoAdjustHeight: {
      elementId: "submit-config",
      extraHeight: 165,
      timeout: 500
    }
  })
}

export function openUpdateCaptureSourceModal(projectName: string, settingsName: string) {
  window.core.openModalWindow({
    options: { width: 550, minWidth: 550, minHeight: 250, title: "Configure plugin" },
    endpoint: `capture/${projectName}/settings/${settingsName}`,
    autoAdjustHeight: {
      elementId: "submit-config",
      extraHeight: 165,
      timeout: 500
    }
  })
}
