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

type SettingType = string | number | boolean

interface ConfigurePluginProps {
  /** The unique identifier for the plugin to be configured. */
  pluginId: string
  /** The display name of the plugin, used in the modal title. */
  pluginName?: string
  /** The text label for the primary submission button. */
  submitLabel?: string
  /** An initial name for the configuration being created or edited. */
  initialConfigName?: string
  /** An initial set of settings to pre-fill the form and send to the API on load. */
  initialSettings?: Record<string, SettingType>
  /** Callback function executed with the config name and final settings when the form is submitted. */
  onSubmit: (name: string, settings: Record<string, SettingType>) => void
  /** Callback function executed when the modal is requested to be closed. */
  onClose: () => void
}

/**
 * A modal component for configuring a plugin. It dynamically generates a form
 * based on properties fetched from an API. Some properties can be "reactive",
 * meaning a change in their value will trigger a refetch of the entire form to
 * update dependent settings.
 *
 * @param {string} props.pluginId - The unique ID for the plugin.
 * @param {string} [props.pluginName="Plugin"] - The name of the plugin for the modal title.
 * @param {string} [props.submitLabel="CONFIGURE"] - The label for the submit button.
 * @param {string} [props.initialConfigName=""] - The initial value for the configuration's name input.
 * @param {Record<string, any>} [props.initialSettings={}] - Initial settings to populate the form.
 * @param {(name: string, settings: Record<string, any>) => void} props.onSubmit - Callback for form submission.
 * @param {() => void} props.onClose - Callback to close the modal.
 * @returns {React.ReactElement} The rendered modal component for plugin configuration.
 */
export default function ConfigurePlugin({
  pluginId,
  pluginName = "Plugin",
  submitLabel = "CONFIGURE",
  initialConfigName = "",
  initialSettings = {},
  onSubmit,
  onClose
}: Readonly<ConfigurePluginProps>) {
  const [settings, setSettings] = useState<Record<string, SettingType>>({})
  const [configName, setConfigName] = useState<string>(initialConfigName)
  const [properties, setProperties] = useState<PluginProperty[]>([])
  const [isLoading, setIsLoading] = useState(false)

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
      setIsLoading(true)
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
      setIsLoading(false)
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
        <Button type="submit" form="submit-config" isLoading={isLoading}>
          {submitLabel}
        </Button>
        <Button styleType="danger" onClick={onClose}>
          CLOSE
        </Button>
      </ModalFooter>
    </PageModal>
  )
}
