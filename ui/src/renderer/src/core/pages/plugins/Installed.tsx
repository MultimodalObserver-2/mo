import pluginService from "@renderer/core/services/PluginService"
import styles from "./plugins.module.css"
import { showApiErrorMessage } from "@renderer/core/utils/dialogMessages"
import { useEffect, useState } from "react"
import { Plugin } from "@renderer/core/types/Plugin"
import fallbackimg from "@renderer/core/assets/images/plugin_fallback.svg"

export default function Installed() {
  const [plugins, setPlugins] = useState<Plugin[]>([])

  useEffect(() => {
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

    fetchPlugins()
  }, [])

  return (
    <div className={styles.installed}>
      <section className={styles.header}>
        <h3 className={styles.title}>Plugins installed</h3>
        <div className={styles.num}>{plugins.length}</div>
      </section>
      <section className={styles.plugins}>
        {plugins.map((plugin) => (
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
                <h3 className={styles.name}>{plugin.name}</h3>
                <div className={styles.version}>{plugin.version}</div>
              </section>
              <p className={styles.description}>{plugin.description}</p>
            </div>
          </article>
        ))}
      </section>
    </div>
  )
}
