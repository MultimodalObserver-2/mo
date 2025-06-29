import styles from "./playback-captured-files.module.css"
import Select from "@renderer/core/components/select/Select"
import { CaptureConfigDetails, CaptureSession } from "@renderer/modules/capture/types/Session"
import { Suspense, useMemo } from "react"
import { PlaybackConfig } from "../../types/PlaybackConfig"
import playbackConfigService from "../../services/PlaybackConfigService"
import playbackService from "../../services/PlaybackService"
import { Await } from "react-router"
import ErrorElement from "@renderer/core/components/error-element/ErrorElement"
import CloseIcon from "@renderer/core/components/icons/CloseIcon"

interface PlaybackData extends PlaybackConfig {
  captures: CaptureConfigDetails[]
  hasDefault: boolean
}

interface PlaybackCapturedFilesProps {
  readonly projectName: string
  readonly session: CaptureSession
  readonly onClose?: () => void
  readonly onChange?: (playbackConfig: PlaybackConfig) => void
  readonly onWarning?: (warn: boolean) => void
  readonly visible?: boolean
}

export default function PlaybackCapturedFiles({
  projectName,
  session,
  onClose = () => {},
  onChange = () => {},
  onWarning = () => {},

  visible = true
}: PlaybackCapturedFilesProps) {
  const playbackDataPromise = useMemo(() => {
    return (async () => {
      const configs = await playbackConfigService.getAll(projectName)
      const data: PlaybackData[] = configs.map((config) => {
        const validExts = playbackService.getPluginValidExtensions(config.plugin_id)
        const captures = session.capture_sources.filter((source) => {
          const ext = source.file_extension?.toLowerCase()
          return ext ? validExts.includes(ext) : false
        })
        const hasDefault = captures.some(
          (capture) => capture.config_id === config.capture_config_id
        )
        return { ...config, captures, hasDefault }
      })

      onWarning(data.some((d) => !d.hasDefault))

      return data
    })()
  }, [projectName, session, onWarning])

  return (
    <section className={`${styles.container} ${visible ? styles.visible : ""}`}>
      <div className={styles.header}>
        <h4 className={styles.title}>Select captured files for playback</h4>
        <CloseIcon className={styles.close} onClick={onClose} />
      </div>
      <div className={styles.selects}>
        <Suspense>
          <Await
            resolve={playbackDataPromise}
            errorElement={<ErrorElement name="Playback captured data config" />}
          >
            {(playbackData: PlaybackData[]) =>
              playbackData.map((data) => (
                <Select
                  key={data.id}
                  name={data.id}
                  label={data.hasDefault ? data.name : `${data.name} ⚠️`}
                  placeholder={`Select a capture`}
                  onChange={(e) => {
                    const newPlaybackConfig: PlaybackConfig = {
                      id: data.id,
                      name: data.name,
                      plugin_id: data.plugin_id,
                      plugin_icon: data.plugin_icon,
                      plugin_is_loaded: data.plugin_is_loaded,
                      capture_config_id: e.target.value,
                      settings: data.settings
                    }
                    onChange(newPlaybackConfig)
                  }}
                  {...(data.hasDefault ? { defaultValue: data.capture_config_id } : {})}
                >
                  {data.captures.map((capture) => (
                    <option key={capture.config_id} value={capture.config_id}>
                      {`${capture.location?.split(/[/\\]/).pop() || ""} – ${capture.plugin_name}`}
                    </option>
                  ))}
                </Select>
              ))
            }
          </Await>
        </Suspense>
      </div>
    </section>
  )
}
