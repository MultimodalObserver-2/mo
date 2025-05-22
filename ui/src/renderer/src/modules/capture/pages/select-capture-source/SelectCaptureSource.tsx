import ModalBody from "@renderer/core/components/page-modal/modal-body/ModalBody"
import ModalHeader from "@renderer/core/components/page-modal/modal-header/ModalHeader"
import PageModal from "@renderer/core/components/page-modal/PageModal"
import { useEffect, useState } from "react"
import ModalTitle from "@renderer/core/components/page-modal/modal-header/ModalTitle"
import captureService from "../../services/CaptureService"
import { Plugin } from "@renderer/core/types/Plugin"
import { showApiErrorMessage } from "@renderer/core/utils/dialogMessages"
import ModalFooter from "@renderer/core/components/page-modal/modal-footer/ModalFooter"
import Button from "@renderer/core/components/button/Button"
import { useParams } from "react-router"
import { openConfigureCaptureSourceModal } from "../../utils/modalWindows"
import {
  PluginCard,
  PluginDisplay,
  PluginDisplayList
} from "@renderer/core/components/plugin-display"
import CameraIcon from "@renderer/core/components/icons/CameraIcon"

export default function SelectCaptureSource() {
  const { projectName } = useParams<{ projectName: string }>()
  const [selectedSource, setSelectedSource] = useState<Plugin | null>(null)
  const [plugins, setPlugins] = useState<Plugin[]>([])

  useEffect(() => {
    const fetchPlugins = async () => {
      try {
        const response = await captureService.getPlugins()
        setPlugins(response.data)
        setSelectedSource(response.data[0] || null)
      } catch (error) {
        showApiErrorMessage(error)
        setPlugins([])
        setSelectedSource(null)
      }
    }

    fetchPlugins()
  }, [])

  if (!projectName) {
    window.close()
    return
  }

  const showSourceProperties = () => {
    if (selectedSource) {
      openConfigureCaptureSourceModal(projectName, selectedSource.name)
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
          <PluginDisplayList selectable={true}>
            {plugins.map((plugin) => (
              <PluginCard
                key={plugin.name}
                name={plugin.name}
                version={plugin.version}
                description={plugin.description}
                iconPath={plugin.icon_path}
                isSelected={selectedSource?.name === plugin.name}
                onClick={() => {
                  setSelectedSource(plugin)
                }}
                showActions={false}
              />
            ))}
          </PluginDisplayList>
        </PluginDisplay>
      </ModalBody>
      <ModalFooter>
        <Button form="create" onClick={showSourceProperties}>
          ADD SOURCE
        </Button>
        <Button styleType="danger" onClick={closeModalWindow}>
          CLOSE
        </Button>
      </ModalFooter>
    </PageModal>
  )
}
