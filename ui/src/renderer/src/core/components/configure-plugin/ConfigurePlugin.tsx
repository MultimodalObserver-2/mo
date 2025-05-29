import ModalBody from "../page-modal/modal-body/ModalBody"
import ModalHeader from "../page-modal/modal-header/ModalHeader"
import ModalTitle from "../page-modal/modal-header/ModalTitle"
import PageModal from "../page-modal/PageModal"
import Button from "../button/Button"
import ModalFooter from "../page-modal/modal-footer/ModalFooter"
import { useEffect, useState } from "react"
import pluginService from "@renderer/core/services/PluginService"
import { PluginProperty } from "@renderer/core/types/PluginProperty"
import PluginSettingProperty from "./PluginSettingProperty"
import Input from "../input/Input"
import { showApiErrorMessage } from "@renderer/core/utils/dialogMessages"

export default function ConfigurePlugin({
  pluginId,
  pluginName = "Plugin",
  submitLabel = "CONFIGURE",
  initialConfigName = "",
  initialSettings = {},
  onSubmit,
  onClose
}: {
  pluginId: string
  pluginName?: string
  submitLabel?: string
  initialConfigName?: string
  initialSettings?: Record<string, string | number | boolean>
  onSubmit: (name: string, settings: Record<string, string | number | boolean>) => void
  onClose: () => void
}) {
  const [settings, setSettings] = useState<Record<string, string | number | boolean>>({})
  const [configName, setConfigName] = useState<string>(initialConfigName)
  const [properties, setProperties] = useState<PluginProperty[]>([])

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    onSubmit(configName, settings)
  }

  const handleChangeProperty = async (val: string | number | boolean, property: PluginProperty) => {
    if (!property.reactive) {
      setSettings((prev) => ({
        ...prev,
        [property.key]: val
      }))
      return
    }
    try {
      const setts = { ...settings, [property.key]: val }
      const response = await pluginService.getSettingProperties(pluginId, setts)
      setProperties(response.data)
      setSettings(setts)
    } catch (error) {
      showApiErrorMessage(error)
    }
  }

  useEffect(() => {
    const fetchProperties = async () => {
      try {
        const response = await pluginService.getSettingProperties(pluginId, initialSettings)
        setProperties(response.data)
        const defaultSettings: Record<string, string | number | boolean> = {}
        for (const property of response.data) {
          if (property.default !== undefined) {
            defaultSettings[property.key] = property.default
          }
        }

        setSettings({
          ...defaultSettings,
          ...initialSettings
        })
      } catch (error) {
        showApiErrorMessage(error)
      }
    }

    fetchProperties()
  }, [pluginId])

  return (
    <PageModal>
      <ModalHeader>
        <ModalTitle title={`${pluginName} configuration`} />
      </ModalHeader>
      <ModalBody type="form" id="submit-config" onSubmit={handleSubmit}>
        <Input
          id="name"
          label="Name"
          type="text"
          placeholder="Enter the configuration name"
          required
          value={configName}
          onChange={(e) => setConfigName(e.target.value)}
        />
        {properties.map((property) => (
          <PluginSettingProperty
            key={property.key}
            property={property}
            value={settings[property.key] || ""}
            onChange={(val) => handleChangeProperty(val, property)}
          />
        ))}
      </ModalBody>
      <ModalFooter>
        <Button type="submit" form="submit-config">
          {submitLabel}
        </Button>
        <Button styleType="danger" onClick={onClose}>
          CLOSE
        </Button>
      </ModalFooter>
    </PageModal>
  )
}
