import { useTranslation } from "react-i18next"
import styles from "./loading.module.css"

export default function LoadingPage() {
  const { t } = useTranslation("core", { keyPrefix: "pages.loading" })

  return (
    <div className={styles.container}>
      <div className={styles.message}>{t("message")}</div>
      <div className={styles.spinner}></div>
    </div>
  )
}
