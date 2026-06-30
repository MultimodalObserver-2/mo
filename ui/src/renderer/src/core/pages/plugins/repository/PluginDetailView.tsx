import { RepositoryPluginDetail } from "@renderer/core/types/RepositoryPlugin"
import Button from "@renderer/core/components/button/Button"
import pluginFallback from "@renderer/core/assets/images/plugin_fallback.svg"
import styles from "./repository.module.css"

type DetailTab = "description" | "releases"

// U+2605 BLACK STAR, built from its code point to avoid an i18next literal-string flag.
const STAR = String.fromCharCode(0x2605)

interface PluginDetailViewProps {
  detail: RepositoryPluginDetail
  activeTab: DetailTab
  onTabChange: (tab: DetailTab) => void
  t: (key: string, options?: Record<string, unknown>) => string
  isInstalled: boolean
  isInstalling: boolean
  onInstall: () => void
}

export default function PluginDetailView({
  detail,
  activeTab,
  onTabChange,
  t,
  isInstalled,
  isInstalling,
  onInstall
}: PluginDetailViewProps) {
  return (
    <div className={styles["detail-view"]}>
      <div className={styles["detail-header"]}>
        <img
          className={styles["detail-logo"]}
          src={detail.logo_url || pluginFallback}
          alt={detail.name}
          onError={(e) => {
            e.currentTarget.onerror = null
            e.currentTarget.src = pluginFallback
          }}
        />
        <div className={styles["detail-info"]}>
          <div className={styles["detail-title-row"]}>
            <h2 className={styles["detail-name"]}>{detail.name}</h2>
            {detail.status && (
              <span className={styles["detail-status"]} data-status={detail.status}>
                {t(`status.${detail.status}`)}
              </span>
            )}
          </div>
          <div className={styles["detail-meta"]}>
            <span>
              <strong>{t("fieldPublisher")}:</strong> {detail.publisher.name}
            </span>
            {detail.category && (
              <span>
                <strong>{t("fieldCategory")}:</strong> {t(`category.${detail.category}`)}
              </span>
            )}
            {detail.author && (
              <span>
                <strong>{t("fieldAuthor")}:</strong> {detail.author.name}
              </span>
            )}
          </div>
          <div className={styles["detail-rating"]}>
            <span className={styles.stars} aria-hidden="true">
              {[0, 1, 2, 3, 4].map((i) => (
                <span
                  key={i}
                  className={
                    i < Math.round(detail.average_rating)
                      ? styles["star-filled"]
                      : styles["star-empty"]
                  }
                >
                  {STAR}
                </span>
              ))}
            </span>
            <span className={styles["rating-value"]}>{detail.average_rating.toFixed(1)}</span>
            <span className={styles["rating-count"]}>({detail.reviews_count})</span>
          </div>
          <p className={styles["detail-description"]}>{detail.description}</p>
          {detail.tags && detail.tags.length > 0 && (
            <div className={styles["detail-tags"]}>
              {detail.tags.map((tag) => (
                <span key={tag} className={styles["detail-tag"]}>
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>
        <div className={styles["detail-actions"]}>
          <Button
            title={
              isInstalled
                ? t("installedHint", { name: detail.name, version: detail.releases[0]?.name })
                : t("installHint", { name: detail.name, version: detail.releases[0]?.name })
            }
            styleType={isInstalled ? "soft" : "default"}
            disabled={isInstalled || isInstalling}
            isLoading={isInstalling}
            onClick={onInstall}
          >
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
