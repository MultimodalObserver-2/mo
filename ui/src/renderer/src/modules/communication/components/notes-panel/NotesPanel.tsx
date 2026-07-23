import { useTranslation } from "react-i18next"
import { NoteMessage } from "../../types/Communication"
import styles from "./notes-panel.module.css"

type Props = {
  notes: NoteMessage[]
}

export default function NotesPanel({ notes }: Props) {
  const { t } = useTranslation("communication", { keyPrefix: "components.notesPanel" })

  const formatTime = (ts: number) => new Date(ts * 1000).toLocaleTimeString()

  return (
    <section className={styles["notes-panel"]}>
      <h3 className={styles.title}>{t("title")}</h3>
      {notes.length === 0 ? (
        <p className={styles.empty}>{t("noNotes")}</p>
      ) : (
        <ul className={styles.list}>
          {notes.map((note, idx) => (
            <li key={idx} className={styles.item}>
              <div className={styles.header}>
                <span className={styles.name}>{note.name}</span>
                <span className={styles.time}>{formatTime(note.timestamp)}</span>
              </div>
              <p className={styles.content}>{note.content}</p>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
