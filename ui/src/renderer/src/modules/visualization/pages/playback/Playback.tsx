import {
  Workspace,
  WorkspaceBody,
  WorkspaceFooter,
  WorkspaceHeader
} from "@renderer/core/components/app-shell"
import { useParams, useSearchParams } from "react-router"
import styles from "./playback.module.css"
import PlaybackDock from "../../components/playback-dock/PlaybackDock"
import sessionService from "@renderer/modules/capture/services/SessionService"
import ErrorElement from "@renderer/core/components/error-element/ErrorElement"
import { useEffect, useRef, useState } from "react"
import { formatDatetime, formatDuration } from "@renderer/modules/capture/utils/helpers"
import { CaptureSession } from "@renderer/modules/capture/types/Session"
import { showApiErrorMessage } from "@renderer/core/utils/dialogMessages"
import { PlaybackConfig } from "../../types/PlaybackConfig"
import playbackService from "../../services/PlaybackService"
import { PlaybackContext } from "../../plugin/PlaybackPlugin"
import PauseIcon from "@renderer/core/components/icons/PauseIcon"
import PlayArrowIcon from "@renderer/core/components/icons/PlayArrowIcon"
import ReplayIcon from "@renderer/core/components/icons/ReplayIcon"

export default function Playback() {
  const { projectName, participantCode, sessionId } = useParams<{
    projectName: string
    participantCode: string
    sessionId: string
  }>()
  const [searchParams] = useSearchParams()
  const [session, setSession] = useState<CaptureSession | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [time, setTime] = useState(0)
  const loopRef = useRef<NodeJS.Timeout | null>(null)
  const loopInterval = 10 // ms
  const syncInterval = 1000 // ms
  const controls = {
    onPlay: window.visualization.playback.onPlay,
    onPause: window.visualization.playback.onPause,
    onSeek: window.visualization.playback.onSeek,
    onSync: window.visualization.playback.onSync
  }

  useEffect(() => {
    const fetchSession = async () => {
      if (!projectName || !participantCode || !sessionId) {
        return
      }

      try {
        const response = await sessionService.get(projectName, participantCode, sessionId)
        setSession(response.data)
      } catch (error) {
        showApiErrorMessage(error)
      }
    }

    fetchSession()
  }, [projectName, participantCode, sessionId])

  const setLoopRefInterval = () => {
    if (!session) {
      return
    }
    if (loopRef.current) {
      clearInterval(loopRef.current)
      loopRef.current = null
    }
    const factor = syncInterval / loopInterval
    let count = 0
    loopRef.current = setInterval(() => {
      setTime((prevTime) => {
        let newTime = prevTime + loopInterval
        if (newTime >= session.duration * 1000) {
          clearInterval(loopRef.current!)
          loopRef.current = null
          setIsPlaying(false)
          window.visualization.playback.pause()
          newTime = session.duration * 1000
        }
        if (++count >= factor) {
          count = 0
          window.visualization.playback.sync(newTime)
        }
        return newTime
      })
    }, loopInterval)
  }

  const handlePlaybackToggle = () => {
    if (!session) {
      return
    }
    if (isPlaying) {
      window.visualization.playback.pause()
      if (loopRef.current) {
        clearInterval(loopRef.current)
        loopRef.current = null
      }
    } else {
      if (time >= session.duration * 1000) {
        setTime(0)
        window.visualization.playback.play(0)
      } else {
        window.visualization.playback.play(time)
      }
      setLoopRefInterval()
    }
    setIsPlaying((prev) => !prev)
  }

  const handleSeek = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!session) {
      return
    }
    const newTime = parseInt(event.target.value, 10)
    window.visualization.playback.seek(newTime)
    setTime(newTime)
    if (loopRef.current) {
      clearInterval(loopRef.current)
      loopRef.current = null
    }

    if (isPlaying) {
      setLoopRefInterval()
    }
  }

  const getCaptureConfigId = (playbackConfig: PlaybackConfig) => {
    return searchParams.get(playbackConfig.id || "") || ""
  }

  function PlaybackPanel({ params }: { params: PlaybackConfig }) {
    if (!params.plugin_is_loaded) {
      return (
        <p>
          The plugin with id <strong>{params.plugin_id}</strong> is not loaded or does not exist.
          Please ensure the plugin is installed and loaded correctly.
        </p>
      )
    }

    const plugin = playbackService.getPluginInstanceById(params.plugin_id)
    plugin.configure(params.settings)
    const captureConfig = session?.capture_sources.find(
      (source) => source.config_name === getCaptureConfigId(params)
    )
    const context: PlaybackContext = {
      filePath: captureConfig?.location || "",
      captureStartTimestamp: session?.start_timestamp || 0,
      fileCaptureStartTimestamp: captureConfig?.start_timestamp || 0,
      pauseIntervals: session?.paused_intervals || []
    }

    return (
      plugin.getView({ controls, context, settings: params.settings }) || (
        <div>No view available</div>
      )
    )
  }

  const renderPlaybackIcon = () => {
    if (isPlaying) {
      return <PauseIcon className={styles["playback-icon"]} />
    }

    if (session?.duration && time >= session.duration * 1000) {
      return <ReplayIcon className={styles["replay-icon"]} />
    }

    return <PlayArrowIcon className={styles["playback-icon"]} />
  }

  if (!projectName || !participantCode || !sessionId) {
    return <ErrorElement name="Playback Error" />
  }

  return (
    <Workspace>
      <WorkspaceHeader>
        <h4 className={styles.header}>
          {session
            ? `Playing session from ${formatDatetime(session.started_at)}`
            : "Session not found"}
        </h4>
      </WorkspaceHeader>
      <WorkspaceBody>
        <PlaybackDock playbackPanel={PlaybackPanel} />
      </WorkspaceBody>
      <WorkspaceFooter borderless>
        <div className={styles["player-controls"]}>
          <section className={styles.left}>
            <button
              className={styles["playback-button"]}
              onClick={handlePlaybackToggle}
              disabled={!session}
            >
              {renderPlaybackIcon()}
            </button>
          </section>
          <section className={styles["progress-bar"]}>
            <span className={styles["time"]}>
              {formatDuration(time / 1000, false, time / 1000 === session?.duration)}
            </span>
            <input
              type="range"
              className={styles["slider"]}
              min={0}
              max={session ? session.duration * 1000 : 0}
              step={1}
              value={time}
              onChange={handleSeek}
            />
            <span className={styles["time"]}>
              {formatDuration(session ? session.duration : 0, false, true)}
            </span>
          </section>
        </div>
      </WorkspaceFooter>
    </Workspace>
  )
}
