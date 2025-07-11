import i18n from "i18next"

const t = i18n.getFixedT(null, "visualization", "modals")

export function openPlaybackViewsModal(projectName: string): void {
  window.core.openModalWindow({
    options: {
      width: 550,
      minWidth: 550,
      minHeight: 250,
      title: t("playbackViews"),
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
      title: t("configurePlaybackView"),
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
      title: t("updatePlaybackView"),
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
