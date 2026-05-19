import { RepositoryPluginDetail } from "@renderer/core/types/RepositoryPlugin"
import Button from "@renderer/core/components/button/Button"
import styles from "./repository.module.css"

type DetailTab = "description" | "releases"

interface PluginDetailViewProps {
  detail: RepositoryPluginDetail
  activeTab: DetailTab
  onTabChange: (tab: DetailTab) => void
  t: (key: string) => string
  isInstalled: boolean
}

export default function PluginDetailView({
  detail,
  activeTab,
  onTabChange,
  t,
  isInstalled
}: PluginDetailViewProps) {
  return (
    <div className={styles["detail-view"]}>
      <div className={styles["detail-header"]}>
        {detail.logo_url && (
          <img
            className={styles["detail-logo"]}
            src={detail.logo_url}
            alt={detail.name}
            onError={(e) => {
              e.currentTarget.style.display = "none"
            }}
          />
        )}
        <div className={styles["detail-info"]}>
          <h2 className={styles["detail-name"]}>{detail.name}</h2>
          <div className={styles["detail-meta"]}>
            <span>
              <strong>{t("fieldPublisher")}:</strong> {detail.publisher.name}
            </span>
            <span>
              <strong>{t("fieldType")}:</strong> {detail.type}
            </span>
            {detail.author && (
              <span>
                <strong>{t("fieldAuthor")}:</strong> {detail.author.name}
              </span>
            )}
          </div>
          <p className={styles["detail-description"]}>{detail.description}</p>
        </div>
        <div className={styles["detail-actions"]}>
          <Button styleType={isInstalled ? "soft" : "default"} disabled={isInstalled}>
            {isInstalled ? t("installed") : t("install")}
          </Button>
        </div>
      </div>

      <div className={styles["detail-nav"]}>
        <button
          className={`${styles["nav-btn"]} ${activeTab === "description" ? styles["nav-btn-active"] : ""}`}
          onClick={() => onTabChange("description")}
        >
          {t("tabDescription")}
        </button>
        <button
          className={`${styles["nav-btn"]} ${activeTab === "releases" ? styles["nav-btn-active"] : ""}`}
          onClick={() => onTabChange("releases")}
        >
          {t("tabReleases")}
        </button>
      </div>

      <div className={styles["detail-content"]}>
        {activeTab === "description" ? (
          detail.long_description ? (
            <pre className={styles["long-description"]}>{detail.long_description}</pre>
          ) : (
            <p className={styles["detail-placeholder"]}>{t("noDescription")}</p>
          )
        ) : detail.releases.length === 0 ? (
          <p className={styles["detail-placeholder"]}>{t("noReleases")}</p>
        ) : (
          <div className={styles.releases}>
            {detail.releases.map((release) => (
              <div key={release._id} className={styles.release}>
                <div className={styles["release-header"]}>
                  <span className={styles["release-name"]}>{release.name}</span>
                  <span className={styles["release-status"]}>{release.status}</span>
                </div>
                <div className={styles.assets}>
                  {release.assets.map((asset) => (
                    <div key={asset.asset_github_id} className={styles.asset}>
                      <span className={styles["asset-so"]}>{asset.so}</span>
                      <span className={styles["asset-name"]}>{asset.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
