import Button from "@renderer/core/components/button/Button"
import { selectSelectedProject } from "@renderer/modules/organization/store/projectsSlice"
import { useSelector } from "react-redux"
import { selectSelectedParticipant } from "@renderer/modules/organization/store/participantsSlice"
import styles from "./sessions-playback.module.css"
import { useLocation, useNavigate } from "react-router"
import PlayStackIcon from "@renderer/core/components/icons/PlayStackIcon"
import HomeIcon from "@renderer/core/components/icons/HomeIcon"

export default function OpenSessionsPlayback() {
  const selectedProject = useSelector(selectSelectedProject)
  const selectedParticipant = useSelector(selectSelectedParticipant)
  const navigate = useNavigate()
  const location = useLocation()
  const isPlaybackPage = location.pathname === "/visualization/sessions/playback"

  const getAbbrText = () => {
    if (isPlaybackPage) {
      return "Return to main screen"
    } else if (!selectedProject && !selectedParticipant) {
      return "Select a project and participant to play sessions"
    } else if (!selectedProject) {
      return "Select a project to play sessions"
    } else if (!selectedParticipant) {
      return "Select a participant to play sessions"
    }

    return `Play previously captured sessions for ${selectedParticipant.name} in ${selectedProject.name}`
  }

  const handleClick = () => {
    if (isPlaybackPage) {
      navigate("/")
    } else {
      navigate("/visualization/sessions/playback")
    }
  }

  return (
    <section className={styles.section}>
      <abbr className={styles.abbr} title={getAbbrText()}>
        <Button
          className={styles.button}
          borderRadius="sm"
          styleType="primary-light"
          onClick={handleClick}
          disabled={!isPlaybackPage && (!selectedProject || !selectedParticipant)}
        >
          {isPlaybackPage ? (
            <>
              <HomeIcon className={styles.icon} />
              BACK TO HOME
            </>
          ) : (
            <>
              <PlayStackIcon className={styles.icon} />
              PLAY SESSIONS
            </>
          )}
        </Button>
      </abbr>
    </section>
  )
}
