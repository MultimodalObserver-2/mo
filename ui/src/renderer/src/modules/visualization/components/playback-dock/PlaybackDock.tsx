import { PlaybackConfig } from "../../types/PlaybackConfig"
import { useSelector } from "react-redux"
import { selectSelectedProject } from "@renderer/modules/organization/store/projectsSlice"
import playbackConfigService from "../../services/PlaybackConfigService"
import {
  DockviewApi,
  DockviewReact,
  DockviewReadyEvent,
  DockviewTheme,
  SerializedDockview
} from "dockview"
import fallbackimgDark from "@renderer/core/assets/images/plugin_fallback.svg"
import { memo, useCallback, useEffect, useRef, useState } from "react"
import { PluginIcons } from "@renderer/core/types/Plugin"
import styles from "./playback-dock.module.css"
import "dockview/dist/styles/dockview.css"
import "./mo-theme-dockview.css"
import { Project } from "@renderer/modules/organization/types/Project"

const moTheme: DockviewTheme = {
  name: "mo",
  className: "dockview-theme-mo",
  gap: 8,
  dndOverlayMounting: "absolute",
  dndPanelOverlay: "group"
}

export default function PlaybackDock() {
  const selectedProject = useSelector(selectSelectedProject)
  const apiRef = useRef<DockviewApi | null>(null)
  const [configs, setConfigs] = useState<PlaybackConfig[]>([])
  const load = useCallback(async () => {
    if (!selectedProject) {
      setConfigs([])
      return
    }
    const loadedConfigs = await playbackConfigService.getAll(selectedProject.name)
    setConfigs(loadedConfigs)
  }, [selectedProject])

  useEffect(() => {
    window.visualization.onReloadPlaybackConfigs(load)
    load()
    return () => {
      window.visualization.removeReloadPlaybackConfigsListeners()
    }
  }, [load])

  useEffect(() => {
    const api = apiRef.current
    if (!api) return

    const existingPanelIds = new Set(api.panels.map((p) => p.id))
    const desiredPanelIds = new Set(configs.map((c) => c.id))

    for (const config of configs) {
      const panelId = config.id
      const panel = api.getPanel(panelId)
      if (!existingPanelIds.has(panelId)) {
        api.addPanel({
          id: panelId,
          component: "playbackPanel",
          tabComponent: "playbackTab",
          title: config.name,
          params: config
        })
      } else if (
        panel &&
        (panel.title !== config.name || panel.params?.plugin_icon !== config.plugin_icon)
      ) {
        panel.api.updateParameters(config)
        panel.api.setTitle(config.name)
      }
    }

    for (const panel of api.panels) {
      if (!desiredPanelIds.has(panel.id)) {
        api.removePanel(panel)
      }
    }
  }, [configs])

  useEffect(() => {
    const api = apiRef.current
    if (!api || !selectedProject) return
    const loadLayoutFunc = async () => {
      await loadLayout(api, selectedProject)
    }
    loadLayoutFunc()
    const disposable = api.onDidLayoutChange(async () => {
      await saveLayout(api.toJSON(), selectedProject)
    })
    return () => {
      disposable.dispose()
    }
  }, [selectedProject])

  const saveLayout = useCallback(async (layout, project: Project) => {
    if (!apiRef.current || !project) return
    try {
      await playbackConfigService.saveLayout(project.name, layout)
    } catch (error) {
      console.error("Failed to save playback layout:", error)
    }
  }, [])

  const loadLayout = useCallback(async (api: DockviewApi, project: Project) => {
    if (!project) return
    try {
      const layout = (await playbackConfigService.getLayout(
        project.name
      )) as unknown as SerializedDockview
      api.fromJSON(layout)
    } catch (error) {
      console.error("Failed to load playback layout:", error)
    }
  }, [])

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
          onReady={async (event: DockviewReadyEvent) => {
            apiRef.current = event.api
            await loadLayout(event.api, selectedProject)
          }}
          defaultRenderer="always"
        />
      )}
    </>
  )
}

const PlaybackPanel = memo(function PlaybackPanel({ params }: { params: PlaybackConfig }) {
  return (
    <div style={{ color: "var(--color-text-dark)" }}>
      <h2>{params.name}</h2>
      <p>Plugin ID: {params.plugin_id}</p>
    </div>
  )
})

const PlaybackTab = memo(function PlaybackTab({ params }: { params: PlaybackConfig }) {
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
})
