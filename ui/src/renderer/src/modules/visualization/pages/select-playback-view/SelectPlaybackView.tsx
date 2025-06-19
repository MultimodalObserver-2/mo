import ModalBody from "@renderer/core/components/page-modal/modal-body/ModalBody"
import ModalHeader from "@renderer/core/components/page-modal/modal-header/ModalHeader"
import PageModal from "@renderer/core/components/page-modal/PageModal"
import { useEffect, useState } from "react"
import ModalTitle from "@renderer/core/components/page-modal/modal-header/ModalTitle"
import { Plugin } from "@renderer/core/types/Plugin"
import { showApiErrorMessage } from "@renderer/core/utils/dialogMessages"
import ModalFooter from "@renderer/core/components/page-modal/modal-footer/ModalFooter"
import Button from "@renderer/core/components/button/Button"
import { useParams } from "react-router"
import {
  PluginCard,
  PluginDisplay,
  PluginDisplayList
} from "@renderer/core/components/plugin-display"
import CameraIcon from "@renderer/core/components/icons/CameraIcon"
import playbackService from "../../services/PlaybackService"
import pluginService from "@renderer/core/services/PluginService"
import { openConfigurePlaybackViewModal } from "../../utils/modalWindows"

export default function SelectPlaybackView() {
  const { projectName } = useParams<{ projectName: string }>()
  const [selectedView, setSelectedView] = useState<Plugin | null>(null)
  const [plugins, setPlugins] = useState<Plugin[]>([])

  useEffect(() => {
    const fetchPlugins = async () => {
      try {
        await pluginService.ui.loadAll()
        const response = playbackService.getPlugins()
        setPlugins(response)
        setSelectedView(response[0] || null)
      } catch (error) {
        showApiErrorMessage(error)
        setPlugins([])
        setSelectedView(null)
      }
    }

    fetchPlugins()
  }, [])

  if (!projectName) {
    window.close()
    return
  }

  const showSourceProperties = () => {
    if (selectedView) {
      openConfigurePlaybackViewModal(projectName, selectedView.id)
    }
  }

  const closeModalWindow = () => {
    window.close()
  }

  return (
    <PageModal>
      <ModalHeader>
        <ModalTitle title="Capture sources" Icon={CameraIcon} />
      </ModalHeader>
      <ModalBody id="modal-body">
        <PluginDisplay style="dark" textSize="sm">
          <PluginDisplayList id="plugin-list" selectable={true}>
            {plugins.map((plugin) => (
              <PluginCard
                key={plugin.id}
                name={plugin.name}
                version={plugin.version}
                description={plugin.description}
                iconPath={plugin.icon_path}
                isSelected={selectedView?.id === plugin.id}
                onClick={() => {
                  setSelectedView(plugin)
                }}
                showActions={false}
              />
            ))}
          </PluginDisplayList>
        </PluginDisplay>
      </ModalBody>
      <ModalFooter>
        <Button form="create" onClick={showSourceProperties}>
          ADD VIEW
        </Button>
        <Button styleType="danger" onClick={closeModalWindow}>
          CLOSE
        </Button>
      </ModalFooter>
    </PageModal>
  )
}
