import DisplayPath from "@renderer/core/components/display-path/DisplayPath"
import styles from "./plugin-details.module.css"
import DisplayData from "@renderer/core/components/display-data/DisplayData"
import ErrorElement from "@renderer/core/components/error-element/ErrorElement"
import InfoIcon from "@renderer/core/components/icons/InfoIcon"
import ModalBody from "@renderer/core/components/page-modal/modal-body/ModalBody"
import ModalHeader from "@renderer/core/components/page-modal/modal-header/ModalHeader"
import ModalTitle from "@renderer/core/components/page-modal/modal-header/ModalTitle"
import PageModal from "@renderer/core/components/page-modal/PageModal"
import { Plugin } from "@renderer/core/types/Plugin"
import {
  showApiErrorMessage,
  showDeletePluginMessage,
  showUnexpectedErrorMessage
} from "@renderer/core/utils/dialogMessages"
import { useEffect, useState } from "react"
import { useParams, useSearchParams } from "react-router"
import DeleteIcon from "@renderer/core/components/icons/DeleteIcon"
import Button from "@renderer/core/components/button/Button"
import pluginService from "@renderer/core/services/PluginService"
import { useTranslation } from "react-i18next"

export default function PluginDetails() {
  const { pluginId, pluginTarget } = useParams<{
    pluginId: string
    pluginTarget: "api" | "ui"
  }>()
  const [searchParams] = useSearchParams()
  const [plugin, setPlugin] = useState<Plugin | null>(null)
  const { t } = useTranslation("core", { keyPrefix: "pages.pluginDetails.fields" })
  const tPage = useTranslation("core", { keyPrefix: "pages.pluginDetails" }).t

  useEffect(() => {
    async function fetchPlugin() {
      if (!pluginId || !pluginTarget) {
        showUnexpectedErrorMessage()
        window.close()
        return
      }

      try {
        const response = await pluginService.get(pluginId, pluginTarget)
        setPlugin(response)
      } catch (error) {
        console.error("Error fetching plugin details:", error)
        showApiErrorMessage(error)
        window.close()
      }
    }

    fetchPlugin()
  }, [pluginId, pluginTarget, searchParams])

  const handleDelete = async (plugin: Plugin) => {
    const acceptId = 0
    const response = await showDeletePluginMessage(
      plugin.name,
      plugin.publisher.name,
      plugin.version,
      acceptId
    )
    if (response.response != acceptId) {
      return
    }

    try {
      await pluginService.delete(plugin.id, plugin.target)
      window.core.plugins.reloadPlugins()
      window.close()
    } catch (error) {
      showApiErrorMessage(error)
    }
  }

  if (!plugin) {
    return <ErrorElement name="Plugin" />
  }

  return (
    <PageModal>
      <ModalHeader className={styles.header}>
        <div className={styles["title-box"]}>
          <ModalTitle title={tPage("title")} Icon={InfoIcon} />
        </div>
        <div className={styles.actions}>
          <Button
            styleType="danger"
            borderRadius="xl"
            className={styles["action-button"]}
            onClick={() => handleDelete(plugin)}
          >
            <DeleteIcon className={styles["action-icon"]} />
          </Button>
        </div>
      </ModalHeader>
      <ModalBody>
        <section className={styles.group}>
          <DisplayData name={t("name")} value={plugin.name} />
          <DisplayData name={t("version")} value={plugin.version} />
          <DisplayData name={t("publisher")} value={plugin.publisher.name} />
        </section>
        <DisplayData name={t("description")} value={plugin.description} />
        <section className={styles.group}>
          <DisplayData name={t("author_name")} value={plugin.author?.name ?? t("unknown")} />
          <DisplayData name={t("author_email")} value={plugin.author?.email ?? t("unknown")} />
        </section>
        <DisplayPath
          name={t("repository")}
          path_type="url"
          value={plugin.repository === "" ? t("unknown") : plugin.repository}
        />
        <DisplayPath name={t("location")} value={plugin.location} />
        <DisplayData name={t("module")} value={plugin.module ?? t("unknown")} />
        <section className={styles.group}>
          <DisplayData name={t("linux")} value={plugin.platforms.linux ? t("yes") : t("no")} />
          <DisplayData name={t("windows")} value={plugin.platforms.windows ? t("yes") : t("no")} />
          <DisplayData name={t("macos")} value={plugin.platforms.macos ? t("yes") : t("no")} />
        </section>
      </ModalBody>
    </PageModal>
  )
}
