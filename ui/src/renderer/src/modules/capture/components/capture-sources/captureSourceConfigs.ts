import { Project } from "@renderer/modules/organization/types/Project"
import captureConfigService from "../../services/CaptureConfigService"
import {
  Config,
  ConfigProvider
} from "@renderer/modules/organization/components/configurations-panel/ConfigurationsPanel"
import {
  showApiErrorMessage,
  showUnexpectedErrorMessage
} from "@renderer/core/utils/dialogMessages"
import { openCaptureSourceModal, openUpdateCaptureSourceModal } from "../../utils/modalWindows"
import { showDeleteCaptureConfigMessage } from "../../utils/dialogMessages"

const captureConfigProvider: ConfigProvider = {
  title: "Capture Sources",
  fetchConfigs: async (project: Project) => {
    try {
      const response = await captureConfigService.getAll(project.name)
      return response.data as Config[]
    } catch {
      showUnexpectedErrorMessage()
      return []
    }
  },
  onReloadConfigs: window.capture.onReloadConfigs,
  onAddConfig: (project: Project) => {
    openCaptureSourceModal(project.name)
  },
  onDeleteConfig: async (project: Project, config: Config) => {
    const acceptId = 0
    const response = await showDeleteCaptureConfigMessage(config.name, project.name, acceptId)
    if (response.response === acceptId) {
      try {
        await captureConfigService.delete(project.name, config.name)
      } catch (error) {
        showApiErrorMessage(error)
      }
    }
  },
  onOpenConfig: (project: Project, config: Config) => {
    openUpdateCaptureSourceModal(project.name, config.name)
  }
}

export default captureConfigProvider
