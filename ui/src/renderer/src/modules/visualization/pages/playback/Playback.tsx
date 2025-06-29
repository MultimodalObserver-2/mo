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

export default function Playback() {
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
          console.log("Reloading sessions")
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
      return "No session available"
    }

    if (isPlaying) {
      return "Pause playback"
    }

    if (session.duration && time >= session.duration * 1000) {
      return "Replay session"
    }

    return "Play session"
  }

  const openSessionInfo = (project: Project, participant: Participant, session: CaptureSession) => {
    openSessionDetailsModal(project?.name, participant?.code, session?.session_id)
  }

  const getOpenSessionsTitle = () => {
    if (!selectedProject || !selectedParticipant || !session) {
      return "No sessions available"
    }

    return showSessionsList ? "Hide sessions list" : "Show sessions list"
  }

  if (!selectedProject || !selectedParticipant) {
    return (
      <Workspace>
        <WorkspaceBody>
          <h4>
            {!selectedProject
              ? "No project selected, please select to play a session"
              : "No participant selected, please select to play a session"}
          </h4>
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
                <title>Session details</title>
              </InfoIcon>
              <h4 className={styles.title}>
                Playing session from{" "}
                <b className={styles.bold}>{formatDatetime(session.started_at)}</b>
              </h4>
            </section>
            <section className={styles.right}>
              <button
                title="Change playback captured files"
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
          <h4 className={styles.header}>Session not found</h4>
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
          <h4 className={styles["no-session"]}>No sessions available</h4>
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
