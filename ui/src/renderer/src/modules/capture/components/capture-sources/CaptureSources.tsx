import styles from "./capture-sources.module.css"
import AddCircleIcon from "@renderer/core/components/icons/AddCircleIcon"
import { selectSelectedProject } from "@renderer/modules/organization/store/projectsSlice"
import { useSelector } from "react-redux"
import { openCaptureSourceModal, openUpdateCaptureSourceModal } from "../../utils/modalWindows"
import {
  ElementActions,
  ElementHeader,
  ElementList,
  ElementListItem,
  ElementTitle,
  PanelElement
} from "@renderer/core/components/panel"
import { useEffect, useState } from "react"
import { CaptureConfig } from "../../types/CaptureConfig"
import {
  showApiErrorMessage,
  showUnexpectedErrorMessage
} from "@renderer/core/utils/dialogMessages"
import captureConfigService from "../../services/CaptureConfigService"
import { Project } from "@renderer/modules/organization/types/Project"
import { PluginIcons } from "@renderer/core/types/Plugin"
import fallbackimgLight from "@renderer/core/assets/images/plugin_fallback_light.svg"
import pluginOffimg from "@renderer/core/assets/images/plugin_off_light.svg"
import { showDeleteCaptureConfigMessage } from "../../utils/dialogMessages"
import SettingsIcon from "@renderer/core/components/icons/SettingsIcon"
import ReportIcon from "@renderer/core/components/icons/ReportIcon"

export default function CaptureSources() {
  const selectedProject = useSelector(selectSelectedProject)
  const [captureConfigs, setCaptureConfigs] = useState<CaptureConfig[]>([])

  const fetchCaptureConfigs = async (project: Project | null) => {
    if (!project) {
      setCaptureConfigs([])
      return
    }
    try {
      const response = await captureConfigService.getAll(project.name)
      setCaptureConfigs(response.data)
    } catch {
      showUnexpectedErrorMessage()
    }
  }

  const handleAdd = () => {
    if (!selectedProject) {
      return
    }
    openCaptureSourceModal(selectedProject.name)
  }

  const deleteConfig = async (config: CaptureConfig) => {
    if (!selectedProject) {
      return
    }

    const acceptId = 0
    const response = await showDeleteCaptureConfigMessage(
      config.name,
      selectedProject.name,
      acceptId
    )
    if (response.response === acceptId) {
      try {
        await captureConfigService.delete(selectedProject.name, config.name)
        await fetchCaptureConfigs(selectedProject)
      } catch (error) {
        showApiErrorMessage(error)
      }
    }
  }

  useEffect(() => {
    window.capture.onReloadConfigs(() => {
      fetchCaptureConfigs(selectedProject)
    })

    fetchCaptureConfigs(selectedProject)
    return () => {
      window.capture.removeReloadConfigsListeners()
    }
  }, [selectedProject])

  const pluginImg = (src: string | PluginIcons, pluginName: string) => {
    const finalSrc = typeof src === "string" ? src : src.light
    return (
      <img
        src={finalSrc}
        alt={pluginName}
        className={styles["plugin-icon"]}
        onError={(e) => {
          e.currentTarget.onerror = null
          e.currentTarget.src = fallbackimgLight
        }}
      />
    )
  }

  const handleOpenConfig = (config: CaptureConfig) => {
    if (!selectedProject) {
      return
    }

    openUpdateCaptureSourceModal(selectedProject.name, config.name)
  }

  return (
    <PanelElement>
      <ElementHeader>
        <ElementTitle>Capture sources</ElementTitle>
        <ElementActions>
          {selectedProject && (
            <button className={styles["add-button"]} onClick={handleAdd}>
              <AddCircleIcon className={styles.svg} />
            </button>
          )}
        </ElementActions>
      </ElementHeader>
      <ElementList>
        {captureConfigs.map((config) => (
          <ElementListItem
            key={config.name}
            label={config.name}
            leftElement={pluginImg(config.plugin_icon || pluginOffimg, config.plugin_id)}
            rightElement={
              config.plugin_is_loaded ? null : (
                <abbr title="Plugin is not loaded">
                  <ReportIcon className={styles.report} />
                </abbr>
              )
            }
            showActions={{ delete: true }}
            onDelete={() => deleteConfig(config)}
            extraActions={
              <SettingsIcon
                className={config.plugin_is_loaded ? "" : styles.disabled}
                onClick={() => handleOpenConfig(config)}
              />
            }
          />
        ))}
      </ElementList>
    </PanelElement>
  )
}
