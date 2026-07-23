import { useTranslation } from "react-i18next"
import { ClientInfo } from "../../types/Communication"
import styles from "./client-list.module.css"

type Props = {
  clients: ClientInfo[]
}

export default function ClientList({ clients }: Props) {
  const { t } = useTranslation("communication", { keyPrefix: "components.clientList" })

  return (
    <section className={styles["client-list"]}>
      <h3 className={styles.title}>{t("title")} ({clients.length})</h3>
      {clients.length === 0 ? (
        <p className={styles.empty}>{t("noClients")}</p>
      ) : (
        <ul className={styles.list}>
          {clients.map((client) => (
            <li key={client.id} className={styles.item}>
              <span className={styles.dot} />
              <span className={styles.ip}>{client.ip}</span>
              <span className={styles.id}>(id: {client.id})</span>
              {client.capture_plugins.length > 0 && (
                <span className={styles.plugins}>
                  {t("streaming")}: {client.capture_plugins.join(", ")}
                </span>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
