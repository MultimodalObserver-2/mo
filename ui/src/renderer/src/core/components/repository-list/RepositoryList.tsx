import { RepositoryPlugin } from "@renderer/core/types/RepositoryPlugin"
import {
  PluginCard,
  PluginDisplay,
  PluginDisplayList
} from "@renderer/core/components/plugin-display"
import pluginFallback from "@renderer/core/assets/images/plugin_fallback.svg"
import styles from "./repository-list.module.css"

interface RepositoryListProps {
  plugins: RepositoryPlugin[]
  isLoadingList: boolean
  isLoadingMore: boolean
  listError: boolean
  /**
   * Whether a plugin is the one open in the detail panel. Injected like `hasUpdate` so the
   * list does not need to know how a plugin's identity is encoded in the route.
   */
  isSelected: (plugin: RepositoryPlugin) => boolean
  /** Whether a plugin shows the "update available" dot. */
  hasUpdate: (plugin: RepositoryPlugin) => boolean
  onSelect: (plugin: RepositoryPlugin) => void
  /** Attached to the bottom sentinel that drives infinite scroll. */
  sentinelRef: React.Ref<HTMLDivElement>
  t: (key: string) => string
}

/**
 * The repository list panel: renders the connection-error and empty states, or the paginated
 * list of plugin cards (each with its update dot) plus the infinite-scroll sentinel.
 */
export default function RepositoryList({
  plugins,
  isLoadingList,
  isLoadingMore,
  listError,
  isSelected,
  hasUpdate,
  onSelect,
  sentinelRef,
  t
}: RepositoryListProps) {
  if (listError) {
    return (
      <div className={styles["list-error"]}>
        <span>{t("connectionError")}</span>
        <span className={styles["list-error-hint"]}>{t("connectionErrorHint")}</span>
      </div>
    )
  }

  if (!isLoadingList && plugins.length === 0) {
    return <div className={styles["detail-empty"]}>{t("noResults")}</div>
  }

  return (
    <PluginDisplay style="light" textSize="sm" isLoading={isLoadingList}>
      <PluginDisplayList isLoading={isLoadingList} selectable>
        {plugins.map((plugin) => (
          <div key={plugin._id} className={styles["card-wrapper"]}>
            <PluginCard
              name={plugin.name}
              description={plugin.description ?? ""}
              iconPath={plugin.logo_url || pluginFallback}
              isSelected={isSelected(plugin)}
              showActions={false}
              onClick={() => onSelect(plugin)}
            />
            {hasUpdate(plugin) && <span className={styles["update-dot"]} />}
          </div>
        ))}
        <div ref={sentinelRef} className={styles["list-sentinel"]} />
        {isLoadingMore && <div className={styles["list-loading-more"]}>{t("loading")}</div>}
      </PluginDisplayList>
    </PluginDisplay>
  )
}
