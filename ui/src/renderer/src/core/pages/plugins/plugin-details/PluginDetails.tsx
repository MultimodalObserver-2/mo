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

export default function PluginDetails() {
  const { pluginId, pluginTarget } = useParams<{
    pluginId: string
    pluginTarget: "api" | "ui"
  }>()
  const [searchParams] = useSearchParams()
  const [plugin, setPlugin] = useState<Plugin | null>(null)

  useEffect(() => {
    async function fetchPlugin() {
      if (!pluginId || !pluginTarget) {
        showUnexpectedErrorMessage()
        window.close()
        return
      }
      if (pluginTarget === "ui") {
        // Register the plugin directory if specified in the search params.
        // This is necessary for UI plugins to load correctly,
        // since memory is not shared between window processes in Electron.
        const dirName = searchParams.get("dir") ?? ""
        await pluginService.ui.registerByDir(dirName)
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
          <ModalTitle title="Plugin details" Icon={InfoIcon} />
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
          <DisplayData name="Name" value={plugin.name} />
          <DisplayData name="Version" value={plugin.version} />
          <DisplayData name="Publisher" value={plugin.publisher.name} />
        </section>
        <DisplayData name="Description" value={plugin.description} />
        <section className={styles.group}>
          <DisplayData name="Author Name" value={plugin.author?.name ?? "Unknown"} />
          <DisplayData name="Author Email" value={plugin.author?.email ?? "Unknown"} />
        </section>
        <DisplayPath
          name="Repository"
          path_type="url"
          value={plugin.repository == "" ? "Unknown" : plugin.repository}
        />
        <DisplayPath name="Location" value={plugin.location} />
        <DisplayData name="Module" value={plugin.module ?? "Unknown"} />
        <section className={styles.group}>
          <DisplayData name="Linux" value={plugin.platforms.linux ? "Yes" : "No"} />
          <DisplayData name="Windows" value={plugin.platforms.windows ? "Yes" : "No"} />
          <DisplayData name="MacOS" value={plugin.platforms.macos ? "Yes" : "No"} />
        </section>
      </ModalBody>
    </PageModal>
  )
}
