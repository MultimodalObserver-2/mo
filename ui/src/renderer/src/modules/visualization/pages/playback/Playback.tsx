import { useTranslation } from "react-i18next"
import {
  Workspace,
  WorkspaceBody,
  WorkspaceFooter,
  WorkspaceHeader
} from "@renderer/core/components/app-shell"
import styles from "./playback.module.css"
import PlaybackDock from "../../components/playback-dock/PlaybackDock"
import sessionService from "@renderer/modules/capture/services/SessionService"
import { useEffect, useRef, useState } from "react"
import { formatDatetime, formatDuration } from "@renderer/modules/capture/utils/helpers"
import { CaptureSession } from "@renderer/modules/capture/types/Session"
import { showApiErrorMessage } from "@renderer/core/utils/dialogMessages"
import PauseIcon from "@renderer/core/components/icons/PauseIcon"
import PlayArrowIcon from "@renderer/core/components/icons/PlayArrowIcon"
import ReplayIcon from "@renderer/core/components/icons/ReplayIcon"
import { useSelector } from "react-redux"
import { selectSelectedProject } from "@renderer/modules/organization/store/projectsSlice"
import { selectSelectedParticipant } from "@renderer/modules/organization/store/participantsSlice"
import { getPlaybackPanel } from "./PlaybackPanel"
import InfoIcon from "@renderer/core/components/icons/InfoIcon"
import { openSessionDetailsModal } from "@renderer/modules/capture/utils/modalWindows"
import { Project } from "@renderer/modules/organization/types/Project"
import { Participant } from "@renderer/modules/organization/types/Participant"
import PlaylistPlayIcon from "@renderer/core/components/icons/PlaylistPlayIcon"
import SessionsList from "../../components/sessions-list/SessionsList"
import PlaylistRemoveIcon from "@renderer/core/components/icons/PlaylistRemoveIcon"
import SettingsIcon from "@renderer/core/components/icons/SettingsIcon"
import RightHeaderActions from "./RightHeaderActions"
import PlaybackCapturedFiles from "../../components/playback-captured-files/PlaybackCapturedFiles"
import SettingsAlertIcon from "@renderer/core/components/icons/SettingsAlertIcon"

/**
 * Visualization Playback page.
 * Provides the main playback controls, session navigation, and config.
 */
export default function Playback() {
  const { t } = useTranslation("visualization", { keyPrefix: "pages.playback" })
  const selectedProject = useSelector(selectSelectedProject)
  const selectedParticipant = useSelector(selectSelectedParticipant)
  const [session, setSession] = useState<CaptureSession | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [time, setTime] = useState(0)
  const [showSessionsList, setShowSessionsList] = useState(false)
  const [showChangeConfig, setShowChangeConfig] = useState(false)
  const [configWarning, setConfigWarning] = useState(false)
  const loopRef = useRef<NodeJS.Timeout | null>(null)
  const loopInterval = 10 // ms
  const syncInterval = 1000 // ms

  const fetchSession = async (unsubReloadSessions?) => {
    if (!selectedProject || !selectedParticipant) {
      return
    }

    try {
      const sessionRes = await sessionService.getLast(
        selectedProject.name,
        selectedParticipant.code
      )

      setSession(sessionRes)
      if (sessionRes === null) {
        const unsub = window.capture.onReloadSessions(() => {
          fetchSession(unsub)
        })
      }
    } catch (error) {
      showApiErrorMessage(error)
    }
    unsubReloadSessions?.()
  }

  useEffect(() => {
    fetchSession()
  }, [selectedProject, selectedParticipant])

  useEffect(() => {
    setIsPlaying(false)
    setTime(0)
    window.visualization?.playback?.pause?.()
    window.visualization?.playback?.seek?.(0)
    if (loopRef.current) {
      clearInterval(loopRef.current)
      loopRef.current = null
    }
  }, [selectedProject, selectedParticipant])

  const setLoopRefInterval = (startTime?: number) => {
    if (!session) {
      return
    }
    if (loopRef.current) {
      clearInterval(loopRef.current)
      loopRef.current = null
    }
    const playTimestamp = Date.now()
    const playStartTime = startTime ?? time
    let lastSyncTime = Date.now()
    loopRef.current = setInterval(() => {
      const now = Date.now()
      let newTime = playStartTime + (now - playTimestamp)
      if (newTime >= session.duration * 1000) {
        clearInterval(loopRef.current!)
        loopRef.current = null
        setIsPlaying(false)
        window.visualization.playback.pause()
        newTime = session.duration * 1000
      }
      setTime(newTime)
      if (now - lastSyncTime >= syncInterval) {
        lastSyncTime = now
        window.visualization.playback.sync(newTime)
      }
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
        setLoopRefInterval(0)
      } else {
        window.visualization.playback.play(time)
        setLoopRefInterval()
      }
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
      setLoopRefInterval(newTime)
    }
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

  const getPlaybackTitle = () => {
    if (!session) {
      return t("noSessionAvailable")
    }

    if (isPlaying) {
      return t("pausePlayback")
    }

    if (session.duration && time >= session.duration * 1000) {
      return t("replaySession")
    }

    return t("playSession")
  }

  const openSessionInfo = (project: Project, participant: Participant, session: CaptureSession) => {
    openSessionDetailsModal(project?.name, participant?.code, session?.session_id)
  }

  const getOpenSessionsTitle = () => {
    if (!selectedProject || !selectedParticipant || !session) {
      return t("noSessionsAvailable")
    }

    return showSessionsList ? t("hideSessionsList") : t("showSessionsList")
  }

  if (!selectedProject || !selectedParticipant) {
    return (
      <Workspace>
        <WorkspaceBody>
          <h4>{!selectedProject ? t("noProjectSelected") : t("noParticipantSelected")}</h4>
        </WorkspaceBody>
      </Workspace>
    )
  }

  return (
    <Workspace className={styles.workspace}>
      <WorkspaceHeader>
        {session ? (
          <div className={styles.header}>
            <section className={styles.left}>
              <InfoIcon
                className={styles.icon}
                onClick={() => openSessionInfo(selectedProject, selectedParticipant, session)}
              >
                <title>{t("sessionDetails")}</title>
              </InfoIcon>
              <h4 className={styles.title}>
                {t("playingSessionFrom") + " "}
                <b className={styles.bold}>{formatDatetime(session.started_at)}</b>
              </h4>
            </section>
            <section className={styles.right}>
              <button
                title={t("changePlaybackCapturedFiles")}
                className={styles["settings-button"]}
                onClick={() => {
                  setShowSessionsList(false)
                  setShowChangeConfig(true)
                }}
              >
                {configWarning ? (
                  <SettingsAlertIcon className={styles.icon} />
                ) : (
                  <SettingsIcon className={styles.icon} />
                )}
              </button>
            </section>
          </div>
        ) : (
          <h4 className={styles.header}>{t("sessionNotFound")}</h4>
        )}
      </WorkspaceHeader>
      <WorkspaceBody className={styles.body}>
        {session ? (
          <PlaybackDock
            key={session.session_id}
            playbackPanel={getPlaybackPanel(session)}
            rightHeaderActions={RightHeaderActions}
          />
        ) : (
          <h4 className={styles["no-session"]}>{t("noSessionsAvailable")}</h4>
        )}
        {session && (
          <SessionsList
            projectName={selectedProject.name}
            participantCode={selectedParticipant.code}
            selectedSession={session}
            onSessionSelected={(selectedSession) => {
              setSession(selectedSession)
              window.visualization.playback.pause()
              window.visualization.playback.seek(0)
              setTime(0)
              setIsPlaying(false)
              if (loopRef.current) {
                clearInterval(loopRef.current)
                loopRef.current = null
              }

              if (selectedSession === null) {
                fetchSession()
              }
            }}
            onClose={() => setShowSessionsList(false)}
            visible={showSessionsList}
          />
        )}
        {session && (
          <PlaybackCapturedFiles
            projectName={selectedProject.name}
            session={session}
            onClose={() => setShowChangeConfig(false)}
            onChange={(newPlaybackConfig) => {
              window.visualization.updatePanelParameters(newPlaybackConfig)
            }}
            onWarning={(warn: boolean) => {
              setConfigWarning(warn)
            }}
            visible={showChangeConfig}
          />
        )}
      </WorkspaceBody>
      <WorkspaceFooter borderless>
        <div className={styles["player-controls"]}>
          <section className={styles["left-controls"]}>
            <button
              title={getPlaybackTitle()}
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
          <section className={styles["right-controls"]}>
            <button
              title={getOpenSessionsTitle()}
              className={styles["sessions-button"]}
              onClick={() => {
                setShowSessionsList((prev) => {
                  if (showChangeConfig && !prev) {
                    setShowChangeConfig(false)
                  }
                  return !prev
                })
              }}
              disabled={!session}
            >
              {showSessionsList ? (
                <PlaylistRemoveIcon className={styles["sessions-icon"]} />
              ) : (
                <PlaylistPlayIcon className={styles["sessions-icon"]} />
              )}
            </button>
          </section>
        </div>
      </WorkspaceFooter>
    </Workspace>
  )
}
