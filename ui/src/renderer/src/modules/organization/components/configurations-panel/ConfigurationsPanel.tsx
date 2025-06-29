import styles from "./configs-panel.module.css"
import AddCircleIcon from "@renderer/core/components/icons/AddCircleIcon"
import { selectSelectedProject } from "@renderer/modules/organization/store/projectsSlice"
import { useSelector } from "react-redux"
import {
  ElementActions,
  ElementHeader,
  ElementList,
  ElementListItem,
  ElementTitle,
  PanelElement
} from "@renderer/core/components/panel"
import { PluginIcons } from "@renderer/core/types/Plugin"
import fallbackimgLight from "@renderer/core/assets/images/plugin_fallback_light.svg"
import pluginOffimg from "@renderer/core/assets/images/plugin_off_light.svg"
import SettingsIcon from "@renderer/core/components/icons/SettingsIcon"
import ReportIcon from "@renderer/core/components/icons/ReportIcon"
import { Project } from "../../types/Project"
import { useEffect, useState } from "react"
import { showUnexpectedErrorMessage } from "@renderer/core/utils/dialogMessages"
import Select from "@renderer/core/components/select/Select"

type configSettings = Record<string, string | number | boolean>

export interface Config {
  name: string
  plugin_id: string
  plugin_icon?: string | PluginIcons
  plugin_is_loaded: boolean
  settings: configSettings
}

export interface ConfigProvider {
  title: string
  fetchConfigs: (project: Project) => Promise<Config[]>
  onReloadConfigs: (callback: () => void) => () => void
  onAddConfig: (project: Project) => void
  onDeleteConfig: (project: Project, config: Config) => Promise<void>
  onOpenConfig: (project: Project, config: Config) => void
}

export interface ConfigurationsPanelProps {
  configProviders: ConfigProvider[]
}

export default function ConfigurationsPanel({
  configProviders
}: Readonly<ConfigurationsPanelProps>) {
  const selectedProject = useSelector(selectSelectedProject)
  const [selectedIdx, setSelectedIndex] = useState<number>(configProviders.length > 0 ? 0 : -1)
  const [configs, setConfigs] = useState<Config[]>([])

  const fetchPluginConfigs = async (project: Project | null) => {
    if (!project || selectedIdx === -1) {
      setConfigs([])
      return
    }
    try {
      const response = (await configProviders[selectedIdx].fetchConfigs(project)) || []
      setConfigs(response)
    } catch {
      showUnexpectedErrorMessage()
    }
  }

  const handleAdd = () => {
    if (!selectedProject || selectedIdx === -1) {
      return
    }
    configProviders[selectedIdx].onAddConfig(selectedProject)
  }

  const deleteConfig = async (config: Config) => {
    if (!selectedProject || selectedIdx === -1) {
      return
    }

    await configProviders[selectedIdx].onDeleteConfig(selectedProject, config)
    await fetchPluginConfigs(selectedProject)
  }

  const handleOpenConfig = (config: Config) => {
    if (!selectedProject || selectedIdx === -1) {
      return
    }

    configProviders[selectedIdx].onOpenConfig(selectedProject, config)
  }

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

  useEffect(() => {
    const unsubReloadConfigs = configProviders[selectedIdx]?.onReloadConfigs(() => {
      fetchPluginConfigs(selectedProject)
    })

    fetchPluginConfigs(selectedProject)
    return () => {
      unsubReloadConfigs?.()
    }
  }, [selectedProject, selectedIdx])

  if (selectedIdx === -1) {
    return null
  }

  return (
    <PanelElement>
      <ElementHeader className={styles.header}>
        <ElementTitle>
          <Select
            styleType="soft"
            className={styles.select}
            value={selectedIdx}
            onChange={(e) => setSelectedIndex(Number(e.target.value))}
          >
            {configProviders.map((config: ConfigProvider, idx) => (
              <option key={`${config.title}-${idx}`} value={idx}>
                {config.title}
              </option>
            ))}
          </Select>
        </ElementTitle>
        <ElementActions>
          {selectedProject && (
            <button className={styles["add-button"]} onClick={handleAdd}>
              <AddCircleIcon className={styles.svg} />
            </button>
          )}
        </ElementActions>
      </ElementHeader>
      <ElementList className={styles.list}>
        {configs.map((config: Config) => (
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
