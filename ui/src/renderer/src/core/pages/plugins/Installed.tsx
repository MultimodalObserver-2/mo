import { showApiErrorMessage, showDeletePluginMessage } from "@renderer/core/utils/dialogMessages"
import { useEffect, useState } from "react"
import { Plugin } from "@renderer/core/types/Plugin"
import { openPluginDetailsModal } from "@renderer/core/utils/modalWindows"
import {
  PluginCard,
  PluginDisplay,
  PluginDisplayHeader,
  PluginDisplayList
} from "@renderer/core/components/plugin-display"
import pluginService from "@renderer/core/services/PluginService"
import styles from "./plugins.module.css"

export default function Installed() {
  const [plugins, setPlugins] = useState<Plugin[]>([])

  const fetchPlugins = async () => {
    try {
      const response = await pluginService.getAll()
      setPlugins(response)
    } catch (error) {
      showApiErrorMessage(error)
    }
  }

  useEffect(() => {
    window.core.plugins.onReloadPlugins(() => {
      fetchPlugins()
    })

    fetchPlugins()

    return () => {
      window.core.plugins.removeReloadPlugins()
    }
  }, [])

  const openDetails = async (plugin: Plugin) => {
    let dirName: string = ""
    if (plugin.target === "ui") {
      dirName = await pluginService.getUiPluginDirName(plugin.id)
    }
    openPluginDetailsModal(plugin.id, plugin.target, dirName)
  }

  const handleDelete = async (plugin: Plugin) => {
    const acceptId = 0
    const response = await showDeletePluginMessage(
      plugin.name,
      plugin.publisher.name,
      plugin.version,
      acceptId
    )
    if (response.response != acceptId) {
      return
    }

    try {
      await pluginService.delete(plugin.id, plugin.target)
      fetchPlugins()
    } catch (error) {
      showApiErrorMessage(error)
    }
  }

  const handleReport = async (plugin: Plugin) => {
    window.core.dialog.showMessageBox({
      type: "warning",
      title: "Plugin error report",
      message: `The plugin failed to load correctly see the error report: \n${plugin.error}`
    })
  }

  const capitalize = (str: string) => str.charAt(0).toUpperCase() + str.slice(1)

  const groupedPlugins = plugins.reduce<Record<string, Plugin[]>>((groups, plugin) => {
    const mod = plugin.module ?? "core"
    if (!groups[mod]) {
      groups[mod] = []
    }
    groups[mod].push(plugin)
    return groups
  }, {})

  if (plugins.length === 0) {
    return (
      <div className={styles["plugins-installed"]}>
        <PluginDisplay className={styles["plugin-display"]}>
          <PluginDisplayHeader title="Plugins" num={0} />
          <PluginDisplayList></PluginDisplayList>
        </PluginDisplay>
      </div>
    )
  }

  return (
    <div className={styles["plugins-installed"]}>
      {Object.entries(groupedPlugins).map(([moduleName, modulePlugins]) => (
        <PluginDisplay key={moduleName} className={styles["plugin-display"]} isExpandable>
          <PluginDisplayHeader
            title={`${capitalize(moduleName)} plugins`}
            num={modulePlugins.length}
          />
          <PluginDisplayList>
            {modulePlugins.map((plugin) => (
              <PluginCard
                key={plugin.id}
                name={plugin.name}
                version={plugin.version}
                description={plugin.description}
                iconPath={plugin.icon_path}
                showReport={true}
                isLoaded={plugin.is_loaded}
                showActions={true}
                onReport={() => handleReport(plugin)}
                onDetails={() => openDetails(plugin)}
                onDelete={() => handleDelete(plugin)}
              />
            ))}
          </PluginDisplayList>
        </PluginDisplay>
      ))}
    </div>
  )
}
