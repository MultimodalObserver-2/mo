import TimerIcon from "@renderer/core/components/icons/TimerIcon"
import { formatDuration } from "../../utils/helpers"
import styles from "./show-duration.module.css"

export default function ShowDuration({ duration }: { readonly duration: number }) {
  return (
    <div className={styles.box}>
      <TimerIcon className={styles.icon} />
      <span className={styles.text}>{formatDuration(duration, false, true)}</span>
    </div>
  )
}
