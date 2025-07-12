import { useTranslation } from "react-i18next"
import Button from "@renderer/core/components/button/Button"
import { selectSelectedProject } from "@renderer/modules/organization/store/projectsSlice"
import { useDispatch, useSelector } from "react-redux"
import { selectSelectedParticipant } from "@renderer/modules/organization/store/participantsSlice"
import styles from "./sessions-playback.module.css"
import { useLocation, useNavigate } from "react-router"
import PlayStackIcon from "@renderer/core/components/icons/PlayStackIcon"
import HomeIcon from "@renderer/core/components/icons/HomeIcon"
import { setMainUrl } from "@renderer/core/store/mainUrlSlice"

export default function OpenSessionsPlayback() {
  const { t } = useTranslation("visualization", { keyPrefix: "components.openSessionsPlayback" })
  const selectedProject = useSelector(selectSelectedProject)
  const selectedParticipant = useSelector(selectSelectedParticipant)
  const navigate = useNavigate()
  const location = useLocation()
  const dispatch = useDispatch()
  const isPlaybackPage = location.pathname === "/visualization/sessions/playback"

  const getAbbrText = () => {
    if (isPlaybackPage) {
      return t("returnToMainScreen")
    } else if (!selectedProject && !selectedParticipant) {
      return t("selectProjectParticipant")
    } else if (!selectedProject) {
      return t("selectProject")
    } else if (!selectedParticipant) {
      return t("selectParticipant")
    }
    return t("playSessionsFor", {
      participant: selectedParticipant.name,
      project: selectedProject.name
    })
  }

  const handleClick = () => {
    if (isPlaybackPage) {
      navigate("/")
      dispatch(setMainUrl("/"))
    } else {
      dispatch(setMainUrl("/visualization/sessions/playback"))
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
              {t("backToHome").toUpperCase()}
            </>
          ) : (
            <>
              <PlayStackIcon className={styles.icon} />
              {t("playSessions").toUpperCase()}
            </>
          )}
        </Button>
      </abbr>
    </section>
  )
}
