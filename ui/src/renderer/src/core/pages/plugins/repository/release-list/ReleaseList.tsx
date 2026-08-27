import Button from "@renderer/core/components/button/Button"
import { RepositoryRelease } from "@renderer/core/types/RepositoryPlugin"
import { hasCompatibleAsset } from "@renderer/core/services/PluginRepositoryService"
import { compareVersions } from "@renderer/core/utils/compareVersions"
import styles from "./release-list.module.css"

interface ReleaseListProps {
  /** Releases as returned by the detail endpoint, in arbitrary order. */
  releases: RepositoryRelease[]
  /** Version currently installed, if any. Marks exactly one release as current. */
  installedVersion?: string
  /** Target OS (`windows`, `linux`, `macos`), used to decide per-release compatibility. */
  platform: string
  /** True while any release of this plugin is being installed; disables every action. */
  isInstalling: boolean
  /** Name (version) of the release currently installing, to spin only that button. */
  installingReleaseName?: string | null
  /** True while the detail request is still resolving its releases. */
  isLoading?: boolean
  /** Installs/updates to the picked release. */
  onInstallRelease: (release: RepositoryRelease) => void
  t: (key: string, options?: Record<string, unknown>) => string
}

/**
 * Renders the releases tab of a repository plugin: one row per version with its assets and
 * the action that installs or switches to it. Owns its loading and empty states so the
 * detail view only has to choose between tabs.
 *
 * @param {RepositoryRelease[]} props.releases - Releases to list, sorted here by precedence.
 * @param {string} [props.installedVersion] - Installed version, if the plugin is installed.
 * @param {string} props.platform - Target OS, injected so the bridge is read once by the page.
 * @param {boolean} props.isInstalling - Whether an installation is in progress.
 * @param {string | null} [props.installingReleaseName] - Release being installed, if any.
 * @param {boolean} [props.isLoading=false] - Whether releases are still being fetched.
 * @param {(release: RepositoryRelease) => void} props.onInstallRelease - Install callback.
 * @param {(key: string, options?: Record<string, unknown>) => string} props.t - Translator.
 * @returns {React.ReactElement} The rendered releases tab.
 */
export default function ReleaseList({
  releases,
  installedVersion,
  platform,
  isInstalling,
  installingReleaseName,
  isLoading = false,
  onInstallRelease,
  t
}: Readonly<ReleaseListProps>) {
  if (isLoading) {
    return <p className={styles["detail-placeholder"]}>{t("loading")}</p>
  }

  if (releases.length === 0) {
    return <p className={styles["detail-placeholder"]}>{t("noReleases")}</p>
  }

  // Copy before sorting: `sort` mutates in place and `releases` comes from state.
  const sorted = [...releases].sort((a, b) => compareVersions(b.name, a.name))

  return (
    <div className={styles.releases}>
      {sorted.map((release) => {
        // A plugin is installed at exactly one version; that release is the current one.
        const isCurrent = installedVersion !== undefined && release.name === installedVersion
        // Any other version can be switched to; without an installed version it's a fresh install
        // Either action is only possible if the release ships an asset for this OS.
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
  )
}
