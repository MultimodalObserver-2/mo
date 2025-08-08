/* eslint-disable i18next/no-literal-string */
import { useTranslation } from "react-i18next"
import styles from "./loading.module.css"
import { useEffect, useState } from "react"

export default function LoadingPage() {
  const { t } = useTranslation("core", { keyPrefix: "pages.loading" })
  const [version, setVersion] = useState("")

  useEffect(() => {
    window.core.app
      .version()
      .then((ver) => {
        setVersion(ver)
      })
      .catch(() => {
        setVersion("")
      })
  }, [])

  return (
    <main className={styles.container}>
      <section className={styles.header}>
        <div className={styles.brand}>
          <h1 className={styles.mo}>Multimodal Observer</h1>
          <span className={styles.version}>v{version}</span>
        </div>
        <h2 className={styles.org}>InTeractiOn Lab</h2>
      </section>

      <section className={styles.loading}>
        <div className={styles.spinner} aria-hidden="true" />
        <div className={styles.message} aria-live="polite">
          {t("message")}
        </div>
      </section>
    </main>
  )
}
