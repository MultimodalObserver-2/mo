import {
  Config,
  ConfigProvider
} from "@renderer/modules/organization/components/configurations-panel/ConfigurationsPanel"
import { openPlaybackViewsModal, openUpdatePlaybackViewModal } from "../../utils/modalWindows"
import { Project } from "@renderer/modules/organization/types/Project"
import playbackConfigService from "../../services/PlaybackConfigService"
import {
  showApiErrorMessage,
  showUnexpectedErrorMessage
} from "@renderer/core/utils/dialogMessages"
import { showDeletePlaybackConfigMessage } from "../../utils/dialogMessages"
import { PlaybackConfig } from "../../types/PlaybackConfig"
import VisibilityIcon from "@renderer/core/components/icons/VisibilityIcon"
import VisibilityOffIcon from "@renderer/core/components/icons/VisibilityOffIcon"

const handleVisibilityToggle = async (project: Project, config: Config) => {
  const playbackConfig = config as PlaybackConfig
  try {
    await playbackConfigService.updateVisibility(project.name, config.name, !playbackConfig.visible)
    window.visualization.reloadPlaybackConfigs()
  } catch (error) {
    showApiErrorMessage(error)
  }
}

const playbackConfigProvider: ConfigProvider = {
  title: "Playback Views",
  fetchConfigs: async (project: Project) => {
    try {
      const response = await playbackConfigService.getAll(project.name)
      return response as Config[]
    } catch {
      showUnexpectedErrorMessage()
      return []
    }
  },
  onReloadConfigs: window.visualization.onReloadPlaybackConfigs,
  onAddConfig: (project: Project) => {
    openPlaybackViewsModal(project.name)
  },
  onDeleteConfig: async (project: Project, config: Config) => {
    const acceptId = 0
    const response = await showDeletePlaybackConfigMessage(config.name, project.name, acceptId)
    if (response.response === acceptId) {
      try {
        await playbackConfigService.delete(project.name, config.name)
        window.visualization.reloadPlaybackConfigs()
      } catch (error) {
        showApiErrorMessage(error)
      }
    }
  },
  onOpenConfig: (project: Project, config: Config) => {
    openUpdatePlaybackViewModal(project.name, config.name)
  },
  extraAction: (project: Project, config: Config) => {
    const playbackConfig = config as PlaybackConfig
    return playbackConfig.visible ? (
      <VisibilityIcon onClick={() => handleVisibilityToggle(project, config)} />
    ) : (
      <VisibilityOffIcon onClick={() => handleVisibilityToggle(project, config)} />
    )
  }
}

export default playbackConfigProvider
