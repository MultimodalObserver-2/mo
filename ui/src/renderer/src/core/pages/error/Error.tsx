import { useTranslation } from "react-i18next"
import styles from "./error.module.css"

export default function ErrorPage() {
  const { t } = useTranslation("core", { keyPrefix: "pages.error" })

  return (
    <div className={styles.container}>
      <div className={styles.message}>
        <h1>{t("title")}</h1>
        <p>{t("description")}</p>
      </div>
    </div>
  )
}
