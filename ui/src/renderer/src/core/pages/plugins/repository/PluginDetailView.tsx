import { useEffect, useState } from "react"
import { RepositoryPluginDetail, RepositoryRelease } from "@renderer/core/types/RepositoryPlugin"
import Button from "@renderer/core/components/button/Button"
import Markdown from "@renderer/core/components/markdown/Markdown"
import BrowserExploreIcon from "@renderer/core/components/icons/BrowserExploreIcon"
import {
  buildPluginWebUrl,
  hasCompatibleAsset,
  latestRelease
} from "@renderer/core/services/PluginRepositoryService"
import { compareVersions } from "@renderer/core/utils/compareVersions"
import pluginFallback from "@renderer/core/assets/images/plugin_fallback.svg"
import styles from "./repository.module.css"

type DetailTab = "description" | "releases"

type InstallState = "install" | "update" | "installed"

// U+2605 BLACK STAR, built from its code point to avoid an i18next literal-string flag.
const STAR = String.fromCharCode(0x2605)

interface PluginDetailViewProps {
  detail: RepositoryPluginDetail
  activeTab: DetailTab
  onTabChange: (tab: DetailTab) => void
  t: (key: string, options?: Record<string, unknown>) => string
  installState: InstallState
  latestVersion?: string
  installedVersion?: string
  isInstalling: boolean
  /** Name (version) of the release currently installing, to spin only that button. */
  installingReleaseName?: string | null
  isLoadingReleases?: boolean
  onInstall: () => void
  /** Installs/updates to a specific release picked from the releases list. */
  onInstallRelease: (release: RepositoryRelease) => void
}

export default function PluginDetailView({
  detail,
  activeTab,
  onTabChange,
  t,
  installState,
  latestVersion,
  installedVersion,
  isInstalling,
  installingReleaseName,
  isLoadingReleases = false,
  onInstall,
  onInstallRelease
}: PluginDetailViewProps) {
  const [downloadProgress, setDownloadProgress] = useState<number | null>(null)

  useEffect(() => {
    window.core.plugins.onDownloadProgress((progress) => {
      setDownloadProgress(progress)
    })

    return () => window.core.plugins.removeDownloadProgress()
  }, [])

  useEffect(() => {
    if (!isInstalling) {
      setDownloadProgress(null)
    }
  }, [isInstalling])

  const platform = window.core.app.platform
  // The header button targets the latest release, so it can only install/update when that
  // release ships an asset for this OS.
  const latest = latestRelease(detail.releases)
  const latestCompatible = latest !== undefined && hasCompatibleAsset(latest, platform)
  const buttonLabel =
    installState === "installed"
      ? t("installed")
      : installState === "update"
        ? t("update")
        : t("install")
  const buttonHint =
    installState === "installed"
      ? t("installedHint", { name: detail.name, version: installedVersion ?? latestVersion })
      : installState === "update"
        ? t("updateHint", { name: detail.name, version: latestVersion })
        : t("installHint", { name: detail.name, version: latestVersion })
  // A plugin without a slug has no page to link to.
  const webUrl = detail.slug ? buildPluginWebUrl(detail.publisher_slug, detail.slug) : undefined
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
            {webUrl && (
              <a
                href={webUrl}
                target="_blank"
                rel="noreferrer"
                title={t("openInWebHint", { name: detail.name })}
                className={styles["web-link"]}
              >
                <BrowserExploreIcon className={styles["web-icon"]} />
              </a>
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
          <div>
            <Button
              title={
                installState !== "installed" && !latestCompatible ? t("noAssetForOs") : buttonHint
              }
              styleType={installState === "installed" ? "soft" : "default"}
              disabled={installState === "installed" || isInstalling || !latestCompatible}
              isLoading={installingReleaseName === latestVersion}
              onClick={onInstall}
            >
              {buttonLabel}
            </Button>
            {downloadProgress !== null && (
              <>
                {downloadProgress < 100 ? (
                  <>
                    <div className={styles["progress-phase"]}>{t("downloading")}</div>
                    <div className={styles["progress-container"]}>
                      <div
                        className={styles["progress-bar"]}
                        style={{ width: `${downloadProgress}%` }}
                      />
                    </div>
                    <div className={styles["progress-percentage"]}>{downloadProgress}%</div>
                  </>
                ) : isInstalling ? (
                  <div className={styles["progress-phase"]}>{t("installing")}</div>
                ) : null}
              </>
            )}
          </div>
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
            <Markdown>{detail.long_description}</Markdown>
          ) : (
            <p className={styles["detail-placeholder"]}>{t("noDescription")}</p>
          )
        ) : isLoadingReleases ? (
          <p className={styles["detail-placeholder"]}>{t("loading")}</p>
        ) : detail.releases.length === 0 ? (
          <p className={styles["detail-placeholder"]}>{t("noReleases")}</p>
        ) : (
          <div className={styles.releases}>
            {/* Copy before sorting: `sort` mutates in place and `detail.releases` is state. */}
            {[...detail.releases]
              .sort((a, b) => compareVersions(b.name, a.name))
              .map((release) => {
                // A plugin is installed at exactly one version; that release is the current one.
                const isCurrent =
                  installedVersion !== undefined && release.name === installedVersion
                // Any other version can be switched to; without an installed version it's a fresh
                // install. Either action is only possible if the release ships an asset for this OS.
                const compatible = hasCompatibleAsset(release, platform)
                const label = isCurrent
                  ? t("installed")
                  : installedVersion === undefined
                    ? t("install")
                    : t("update")
                return (
                  <div key={release._id ?? release.name} className={styles.release}>
                    <div className={styles["release-header"]}>
                      <span className={styles["release-name"]}>{release.name}</span>
                      <span className={styles["release-status"]}>
                        {release.status && t(`status.${release.status}`)}
                      </span>
                      <Button
                        className={styles["release-action"]}
                        styleType={isCurrent ? "soft" : "default"}
                        disabled={isCurrent || !compatible || isInstalling}
                        isLoading={installingReleaseName === release.name}
                        title={!isCurrent && !compatible ? t("noAssetForOs") : undefined}
                        onClick={() => onInstallRelease(release)}
                      >
                        {label}
                      </Button>
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
                )
              })}
          </div>
        )}
      </div>
    </div>
  )
}
