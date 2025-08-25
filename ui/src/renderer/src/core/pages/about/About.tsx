/* eslint-disable i18next/no-literal-string */
import styles from "./about.module.css"
import { Trans, useTranslation } from "react-i18next"
import { useEffect, useState } from "react"
import logoMOo from "@renderer/core/assets/images/logo_moo.png"
import logoITO from "@renderer/core/assets/images/logo_ito.png"
import GitHubIcon from "@renderer/core/components/icons/GitHubIcon"
import CaptivePortalIcon from "@renderer/core/components/icons/CaptivePortalIcon"

export default function AboutPage() {
  const { t } = useTranslation("core", { keyPrefix: "pages.about" })
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
    <main className={styles.main}>
      <h1 className={styles.title}>{t("title")}</h1>
      <section className={styles.content}>
        <article className={styles.info}>
          <div className={styles.brand}>
            <a href="https://github.com/MultimodalObserver-2/mo" target="_blank" rel="noreferrer">
              <img
                className={styles.logo}
                style={{ padding: "5px 0 0 0" }}
                src={logoMOo}
                alt="Multimodal Observer logo"
              />
            </a>
            <div>
              <h1 className={styles.name}>
                Multimodal Observer <b className={styles.short}>(MOo)</b>
              </h1>
              <section className={styles["sub-section"]}>
                <span className={styles.version}>v{version}</span>
                <a
                  href="https://github.com/MultimodalObserver-2/mo"
                  target="_blank"
                  rel="noreferrer"
                  className={styles.link}
                >
                  <GitHubIcon className={styles.icon} />
                </a>
              </section>
            </div>
          </div>
          <p className={styles.description}>
            <Trans
              i18nKey="pages.about.moo.description"
              components={{
                1: <b />,
                2: <b />,
                3: <b />
              }}
            />
          </p>
          <p className={styles.description}>
            <Trans
              i18nKey="pages.about.moo.sdks.intro"
              components={{
                1: <b />,
                2: <b />
              }}
            />
          </p>
          <ul className={styles.list}>
            <li>
              <a
                href="https://github.com/MultimodalObserver-2/mo-ui-sdk"
                target="_blank"
                rel="noreferrer"
                className={styles.link}
              >
                <b>
                  MO UI SDK <GitHubIcon className={styles.icon} />
                </b>
              </a>{" "}
              {t("moo.sdks.ui")}
            </li>
            <li>
              <a
                href="https://github.com/MultimodalObserver-2/mo-api-sdk"
                target="_blank"
                rel="noreferrer"
                className={styles.link}
              >
                <b>
                  MO API SDK <GitHubIcon className={styles.icon} />
                </b>
              </a>
              {t("moo.sdks.api")}
            </li>
          </ul>
        </article>
        <article className={styles.info}>
          <div className={styles.brand}>
            <a href="https://interaction-lab.info/" target="_blank" rel="noreferrer">
              <img className={styles.logo} src={logoITO} alt="InTeractiOn logo" />
            </a>
            <div>
              <h1 className={styles.name}>
                InTeractiOn <b className={styles.short}>(ITO)</b>
              </h1>
              <section className={styles["sub-section"]}>
                <span className={styles.subname}>Research Lab</span>
                <a
                  href="https://interaction-lab.info/"
                  target="_blank"
                  rel="noreferrer"
                  className={styles.link}
                >
                  <CaptivePortalIcon className={styles.icon} />
                </a>
              </section>
            </div>
          </div>
          <p className={styles.description}>
            <Trans
              i18nKey="pages.about.ito.description"
              components={{
                1: <b />,
                2: <b />
              }}
            />
          </p>
        </article>
      </section>
    </main>
  )
}
