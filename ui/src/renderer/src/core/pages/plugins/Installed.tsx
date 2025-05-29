import pluginService from "@renderer/core/services/PluginService"
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

export default function Installed() {
  const [plugins, setPlugins] = useState<Plugin[]>([])

  const fetchPlugins = async () => {
    try {
      const response = await pluginService.getAll()
      const plugins = response.data
      setPlugins(plugins)
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

  const openDetails = (plugin: Plugin) => {
    openPluginDetailsModal(plugin.id)
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
      await pluginService.delete(plugin.id)
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

  return (
    <PluginDisplay>
      <PluginDisplayHeader title="Installed plugins" num={plugins.length} />
      <PluginDisplayList>
        {plugins.map((plugin) => (
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
  )
}
