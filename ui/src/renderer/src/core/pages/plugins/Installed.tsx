import pluginService from "@renderer/core/services/PluginService"
import styles from "./plugins.module.css"
import { showApiErrorMessage, showDeletePluginMessage } from "@renderer/core/utils/dialogMessages"
import { useEffect, useState } from "react"
import { Plugin } from "@renderer/core/types/Plugin"
import fallbackimg from "@renderer/core/assets/images/plugin_fallback.svg"
import InfoIcon from "@renderer/core/components/icons/InfoIcon"
import { openPluginDetailsModal } from "@renderer/core/utils/modalWindows"
import DeleteIcon from "@renderer/core/components/icons/DeleteIcon"
import ReportIcon from "@renderer/core/components/icons/ReportIcon"

export default function Installed() {
  const [plugins, setPlugins] = useState<Plugin[]>([])

  const fetchPlugins = async () => {
    try {
      const response = await pluginService.getAll()
      const plugins = response.data
      console.log(plugins)
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
    openPluginDetailsModal(plugin.name, plugin.version)
  }

  const handleDelete = async (plugin: Plugin) => {
    const acceptId = 0
    const response = await showDeletePluginMessage(plugin.name, plugin.version, acceptId)
    if (response.response != acceptId) {
      return
    }

    try {
      await pluginService.delete(plugin.name)
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
    <div className={styles.installed}>
      <section className={styles.header}>
        <h3 className={styles.title}>Plugins installed</h3>
        <div className={styles.num}>{plugins.length}</div>
      </section>
      <section className={styles.plugins}>
        {plugins.length != 0 ? (
          plugins.map((plugin) => (
            <article key={plugin.name + plugin.version} className={styles.plugin}>
              <img
                src={plugin.icon_path}
                alt={plugin.name}
                className={styles.icon}
                onError={(e) => {
                  e.currentTarget.onerror = null
                  e.currentTarget.src = fallbackimg
                }}
              />
              <div className={styles.data}>
                <section className={styles.top}>
                  <div className={styles.info}>
                    <h3 className={styles.name}>{plugin.name}</h3>
                    <div className={styles.version}>{plugin.version}</div>
                    {!plugin.is_loaded && (
                      <button className={styles.report} onClick={() => handleReport(plugin)}>
                        <ReportIcon className={styles["report-icon"]} />
                      </button>
                    )}
                  </div>
                  <div className={styles.actions}>
                    <InfoIcon
                      className={`${styles["action-icon"]} ${styles["normal-icon"]}`}
                      onClick={() => openDetails(plugin)}
                    />
                    <DeleteIcon
                      className={`${styles["action-icon"]} ${styles["danger-icon"]}`}
                      onClick={() => handleDelete(plugin)}
                    />
                  </div>
                </section>
                <p className={styles.description}>{plugin.description}</p>
              </div>
            </article>
          ))
        ) : (
          <article>
            <h3 className={styles.empty}>No plugins installed</h3>
          </article>
        )}
      </section>
    </div>
  )
}
