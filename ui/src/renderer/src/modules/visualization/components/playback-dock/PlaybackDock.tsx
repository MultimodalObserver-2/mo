import { FunctionComponent, memo, useEffect, useState } from "react"
import { useSelector } from "react-redux"
import {
  DockviewApi,
  DockviewIDisposable,
  DockviewReact,
  DockviewTheme,
  IDockviewHeaderActionsProps,
  IDockviewPanelProps,
  SerializedDockview
} from "dockview"
import playbackConfigService from "../../services/PlaybackConfigService"
import { selectSelectedProject } from "@renderer/modules/organization/store/projectsSlice"
import { PlaybackConfig } from "../../types/PlaybackConfig"
import { PluginIcons } from "@renderer/core/types/Plugin"
import fallbackimgDark from "@renderer/core/assets/images/plugin_fallback.svg"
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

interface PlaybackDockProps {
  readonly playbackPanel: FunctionComponent<IDockviewPanelProps<PlaybackConfig>>
  readonly rightHeaderActions?: FunctionComponent<IDockviewHeaderActionsProps>
}

export default function PlaybackDock({ playbackPanel, rightHeaderActions }: PlaybackDockProps) {
  const selectedProject = useSelector(selectSelectedProject)
  const [api, setApi] = useState<DockviewApi | null>(null)

  const saveLayout = async () => {
    if (!selectedProject || !api) {
      return
    }
    try {
      await playbackConfigService.saveLayout(
        selectedProject.name,
        api.toJSON() as unknown as Record<string, unknown>
      )
    } catch (err) {
      console.error("Error saving layout:", err)
    }
  }

  useEffect(() => {
    if (!selectedProject || !api) {
      return
    }
    const loadConfigs = async () => {
      const configs = await playbackConfigService.getAll(selectedProject.name)
      const visibleConfigs = configs.filter((c) => c.visible)
      const existing = new Set(api.panels.map((p) => p.id))
      const desired = new Set(visibleConfigs.map((c) => c.id))

      visibleConfigs.forEach((cfg) => {
        const panel = api.getPanel(cfg.id)
        if (!existing.has(cfg.id)) {
          api.addPanel({
            id: cfg.id,
            component: "playbackPanel",
            tabComponent: "playbackTab",
            title: cfg.name,
            params: cfg
          })
        } else if (panel) {
          const old = panel.params as PlaybackConfig
          if (!playbackConfigService.isEqual(old, cfg)) {
            panel.api.setTitle(cfg.name)
            panel.api.updateParameters(cfg)
          }
        }
      })

      api.panels.forEach((p) => {
        if (!desired.has(p.id)) {
          api.removePanel(p)
        }
      })
    }
    let sub: DockviewIDisposable
    const loadAll = async () => {
      sub = api.onDidLayoutChange(saveLayout)
      try {
        const saved = (await playbackConfigService.getLayout(
          selectedProject.name
        )) as unknown as SerializedDockview
        if (saved) {
          api.fromJSON(saved)
        }
      } catch (err) {
        console.warn("Error loading the layout: ", err)
      }

      await loadConfigs()
    }
    loadAll()
    const unsubReloadConfigs = window.visualization.onReloadPlaybackConfigs(loadConfigs)
    const unsubUpdateParams = window.visualization.onUpdatePanelParameters((params: unknown) => {
      const cfgParams = params as PlaybackConfig
      const panel = api.getPanel(cfgParams.id)
      if (panel) {
        panel.api.updateParameters(cfgParams)
      } else {
        console.warn(`Panel with id ${cfgParams.id} not found`)
      }
    })
    return () => {
      sub.dispose()
      unsubReloadConfigs()
      unsubUpdateParams()
    }
  }, [selectedProject, api])

  return selectedProject ? (
    <DockviewReact
      theme={moTheme}
      components={{ playbackPanel: playbackPanel }}
      tabComponents={{ playbackTab: PlaybackTab }}
      rightHeaderActionsComponent={rightHeaderActions}
      onReady={(event) => {
        setApi(event.api)
      }}
      defaultRenderer="always"
    />
  ) : null
}

const PlaybackTab = memo(function PlaybackTab({ params }: { params: PlaybackConfig }) {
  let src = fallbackimgDark
  if (params.plugin_icon === "string") {
    src = params.plugin_icon
  } else if (typeof params.plugin_icon === "object") {
    src = (params.plugin_icon as PluginIcons)?.dark
  }

  return (
    <div className={styles["playback-tab"]}>
      <img
        src={src}
        alt={params.name}
        className={styles["plugin-icon"]}
        onError={(e) => {
          e.currentTarget.onerror = null
          e.currentTarget.src = fallbackimgDark
        }}
      />
      <h4 className={styles.title}>{params.name}</h4>
    </div>
  )
})
