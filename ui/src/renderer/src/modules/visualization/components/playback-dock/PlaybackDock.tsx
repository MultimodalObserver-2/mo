import { PlaybackConfig } from "../../types/PlaybackConfig"
import { useSelector } from "react-redux"
import { selectSelectedProject } from "@renderer/modules/organization/store/projectsSlice"
import playbackConfigService from "../../services/PlaybackConfigService"
import { DockviewApi, DockviewReact, DockviewReadyEvent, DockviewTheme } from "dockview"
import fallbackimgDark from "@renderer/core/assets/images/plugin_fallback.svg"
import { useEffect, useState } from "react"
import { PluginIcons } from "@renderer/core/types/Plugin"
import styles from "./playback-dock.module.css"
import "dockview/dist/styles/dockview.css"
import "./mo-theme-dockview.css"

const moTheme: DockviewTheme = {
  name: "mo",
  className: "dockview-theme-mo",
  gap: 8,
  dndOverlayMounting: "absolute",
  dndPanelOverlay: "group"
}

export default function PlaybackDock() {
  const selectedProject = useSelector(selectSelectedProject)
  const [api, setApi] = useState<DockviewApi | null>(null)
  const [configs, setConfigs] = useState<PlaybackConfig[]>([])
  const load = async () => {
    if (!selectedProject) {
      setConfigs([])
      return
    }
    const loadedConfigs = await playbackConfigService.getAll(selectedProject.name)
    setConfigs(loadedConfigs)
  }

  useEffect(() => {
    window.visualization.onReloadPlaybackConfigs(() => {
      load()
    })
    load()
    return () => {
      window.visualization.removeReloadPlaybackConfigsListeners()
    }
  }, [selectedProject])

  useEffect(() => {
    if (!api) return

    const existingPanelIds = new Set(api.panels.map((p) => p.id))
    const desiredPanelIds = new Set(configs.map((c) => `playback-${c.name}`))

    for (const config of configs) {
      const panelId = `playback-${config.name}`
      if (!existingPanelIds.has(panelId)) {
        api.addPanel({
          id: panelId,
          component: "playbackPanel",
          tabComponent: "playbackTab",
          title: config.name,
          params: config
        })
      }
    }

    for (const panel of api.panels) {
      if (!desiredPanelIds.has(panel.id)) {
        api.removePanel(panel)
      }
    }
  }, [api, configs])

  return (
    <>
      {selectedProject && (
        <DockviewReact
          theme={moTheme}
          components={{
            playbackPanel: PlaybackPanel
          }}
          tabComponents={{
            playbackTab: PlaybackTab
          }}
          onReady={(event: DockviewReadyEvent) => {
            const dockviewApi = event.api
            setApi(dockviewApi)
          }}
          defaultRenderer="always"
        />
      )}
    </>
  )
}

function PlaybackPanel({ params }: { params: PlaybackConfig }) {
  return (
    <div style={{ color: "var(--color-text-dark)" }}>
      <h2>{params.name}</h2>
      <p>Plugin ID: {params.plugin_id}</p>
    </div>
  )
}

function PlaybackTab({ params }: { params: PlaybackConfig }) {
  const pluginImg = (src: string | PluginIcons, pluginName: string) => {
    const finalSrc = typeof src === "string" ? src : src.dark
    return (
      <img
        src={finalSrc}
        alt={pluginName}
        className={styles["plugin-icon"]}
        onError={(e) => {
          e.currentTarget.onerror = null
          e.currentTarget.src = fallbackimgDark
        }}
      />
    )
  }

  return (
    <div className={styles["playback-tab"]}>
      {pluginImg(params.plugin_icon || fallbackimgDark, params.name)}
      <h4 className={styles.title}>{params.name}</h4>
    </div>
  )
}
