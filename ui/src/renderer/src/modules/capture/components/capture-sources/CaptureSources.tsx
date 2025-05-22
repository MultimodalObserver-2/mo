import styles from "./capture-sources.module.css"
import AddCircleIcon from "@renderer/core/components/icons/AddCircleIcon"
import { selectSelectedProject } from "@renderer/modules/organization/store/projectsSlice"
import { useSelector } from "react-redux"
import { openCaptureSourceModal } from "../../utils/modalWindows"
import {
  ElementActions,
  ElementHeader,
  ElementList,
  ElementListItem,
  ElementTitle,
  PanelElement
} from "@renderer/core/components/panel"
import { useEffect, useState } from "react"
import { CaptureSetting } from "../../types/CaptureSetting"
import { showApiErrorMessage, showUnexpectedErrorMessage } from "@renderer/core/utils/dialogMessages"
import captureSettingsService from "../../services/CaptureSettingsService"
import { Project } from "@renderer/modules/organization/types/Project"
import { PluginIcons } from "@renderer/core/types/Plugin"
import fallbackimgLight from "@renderer/core/assets/images/plugin_fallback_light.svg"
import { showDeleteCaptureSettingsMessage } from "../../utils/dialogMessages"

export default function CaptureSources() {
  const selectedProject = useSelector(selectSelectedProject)
  const [captureSettings, setCaptureSettings] = useState<CaptureSetting[]>([])

  const fetchCaptureSettings = async (project: Project | null) => {
    if (!project) {
      setCaptureSettings([])
      return
    }
    try {
      const response = await captureSettingsService.getAll(project.name)
      setCaptureSettings(response.data)
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

  const deleteSettings = async (setting: CaptureSetting) => {
    if (!selectedProject) {
      return
    }

    const acceptId = 0
    const response = await showDeleteCaptureSettingsMessage(
      setting.name,
      selectedProject.name,
      acceptId
    )
    if (response.response === acceptId) {
      try {
        await captureSettingsService.delete(selectedProject.name, setting.name)
        await fetchCaptureSettings(selectedProject)
      } catch (error) {
        showApiErrorMessage(error)
      }
    }
  }

  useEffect(() => {
    window.capture.onReloadSettings(() => {
      console.log("Reloading capture settings")
      fetchCaptureSettings(selectedProject)
    })

    fetchCaptureSettings(selectedProject)
    return () => {
      window.capture.removeReloadSettings()
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
        {captureSettings.map((settings) => (
          <ElementListItem
            key={settings.name}
            label={settings.name}
            leftElement={pluginImg(settings.plugin_icon, settings.plugin_name)}
            showActions={{ delete: true }}
            onDelete={() => deleteSettings(settings)}
          />
        ))}
      </ElementList>
    </PanelElement>
  )
}
