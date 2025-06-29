export function openPlaybackViewsModal(projectName: string): void {
  window.core.openModalWindow({
    options: {
      width: 550,
      minWidth: 550,
      minHeight: 250,
      title: "Playback views",
      webPreferences: {
        webSecurity: false,
        allowRunningInsecureContent: true
      }
    },
    endpoint: `visualization/select-playback-view/${projectName}`,
    autoAdjustHeight: {
      elementId: "modal-body",
      extraHeight: 165,
      errorHeight: 250,
      setMinimumSize: true
    }
  })
}

export function openConfigurePlaybackViewModal(projectName: string, pluginId: string): void {
  window.core.openModalWindow({
    options: {
      width: 550,
      minWidth: 550,
      minHeight: 250,
      title: "Configure playback view",
      webPreferences: {
        webSecurity: false,
        allowRunningInsecureContent: true
      }
    },
    endpoint: `visualization/${projectName}/playback-views/${pluginId}`,
    autoAdjustHeight: {
      elementId: "submit-config",
      extraHeight: 165,
      errorHeight: 250,
      setMinimumSize: true
    }
  })
}

export function openUpdatePlaybackViewModal(projectName: string, configName: string): void {
  window.core.openModalWindow({
    options: {
      width: 550,
      minWidth: 550,
      minHeight: 250,
      title: "Update playback view",
      webPreferences: {
        webSecurity: false,
        allowRunningInsecureContent: true
      }
    },
    endpoint: `visualization/${projectName}/playback-configs/${configName}`,
    autoAdjustHeight: {
      elementId: "submit-config",
      extraHeight: 165,
      errorHeight: 250,
      setMinimumSize: true
    }
  })
}
