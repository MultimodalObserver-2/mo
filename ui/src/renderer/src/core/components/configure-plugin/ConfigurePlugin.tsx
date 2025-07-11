import { useTranslation } from "react-i18next"
import ModalBody from "../page-modal/modal-body/ModalBody"
import ModalHeader from "../page-modal/modal-header/ModalHeader"
import ModalTitle from "../page-modal/modal-header/ModalTitle"
import PageModal from "../page-modal/PageModal"
import Button from "../button/Button"
import ModalFooter from "../page-modal/modal-footer/ModalFooter"
import { useEffect, useState } from "react"
import {
  PluginProperty,
  PluginPropertyTypes,
  PropertyDataNumber
} from "@renderer/core/types/PluginProperty"
import PluginSettingProperty from "./PluginSettingProperty"
import Input from "../input/Input"
import { showApiErrorMessage } from "@renderer/core/utils/dialogMessages"
import pluginService from "@renderer/core/services/PluginService"

type SettingType = string | number | boolean

interface ConfigurePluginProps {
  pluginId: string
  target: string
  pluginName?: string
  submitLabel?: string
  initialConfigName?: string
  initialSettings?: Record<string, SettingType>
  children?: React.ReactNode
  childrenPosition?: "top" | "middle" | "bottom"
  onSubmit: (
    name: string,
    settings: Record<string, SettingType>,
    extra?: Record<string, SettingType>
  ) => void
  onClose: () => void
}

export default function ConfigurePlugin({
  pluginId,
  target,
  pluginName = "Plugin",
  submitLabel = "CONFIGURE",
  initialConfigName = "",
  initialSettings = {},
  children,
  childrenPosition = "middle",
  onSubmit,
  onClose
}: Readonly<ConfigurePluginProps>) {
  const { t } = useTranslation("core", { keyPrefix: "pages.configurePlugin" })
  const [settings, setSettings] = useState<Record<string, SettingType>>({})
  const [configName, setConfigName] = useState<string>(initialConfigName)
  const [properties, setProperties] = useState<PluginProperty[]>([])
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    // Send extra inputs (if any) to the onSubmit callback
    const extraInputs: Record<string, SettingType> = {}
    if (children) {
      const form = e.currentTarget as HTMLFormElement
      const formData = new FormData(form)
      formData.forEach((value, key) => {
        extraInputs[key] = value as SettingType
      })

      // Remove the configName from extra inputs
      delete extraInputs.name
      // Remove the settings from extra inputs
      for (const key of Object.keys(settings)) {
        delete extraInputs[key]
      }
    }

    onSubmit(configName, settings, extraInputs)
  }

  const changeToDefault = (property: PluginProperty, settings: Record<string, SettingType>) => {
    if (property.default !== undefined && settings[property.key] === undefined) {
      return true
    }

    if (
      property.property_type === PluginPropertyTypes.INT ||
      property.property_type === PluginPropertyTypes.FLOAT
    ) {
      const value = settings[property.key] as number
      const data = property.data as PropertyDataNumber
      return (
        (data.min !== undefined && value < data.min) ||
        (data.max !== undefined && value > data.max) ||
        (data.step !== undefined && value % data.step !== 0)
      )
    }

    if (property.property_type === PluginPropertyTypes.TEXT) {
      const value = settings[property.key] as string
      const data = property.data as { max_length?: number; min_length?: number }
      return (
        (data.min_length !== undefined && value.length < data.min_length) ||
        (data.max_length !== undefined && value.length > data.max_length)
      )
    }

    if (property.property_type === PluginPropertyTypes.BOOL) {
      return settings[property.key] !== true && settings[property.key] !== false
    }

    if (property.property_type === PluginPropertyTypes.PATH) {
      const value = settings[property.key] as string
      const data = property.data as { file_types?: string[] }
      return !value || (data.file_types && !data.file_types.includes(value.split(".").pop() ?? ""))
    }

    if (property.property_type === PluginPropertyTypes.SELECT) {
      const value = settings[property.key]
      const data = property.data as { options: { value: SettingType }[] }
      return !data.options.some((option) => option.value === value)
    }

    return false
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
      const response = await pluginService.getSettingProperties(pluginId, target, setts)
      setProperties(response)
      for (const prop of response) {
        if (changeToDefault(prop, setts)) {
          setts[prop.key] = prop.default ?? ""
        }
      }
      setSettings(setts)
    } catch (error) {
      showApiErrorMessage(error)
    }
  }

  useEffect(() => {
    const fetchProperties = async () => {
      setIsLoading(true)
      try {
        const response = await pluginService.getSettingProperties(pluginId, target, initialSettings)
        setProperties(response)
        const defaultSettings: Record<string, SettingType> = {}
        for (const property of response) {
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
  }, [pluginId, target])

  return (
    <PageModal>
      <ModalHeader>
        <ModalTitle title={t("configurationTitle", { pluginName })} />
      </ModalHeader>
      <ModalBody type="form" id="submit-config" onSubmit={handleSubmit}>
        {children && childrenPosition === "top" && <>{children}</>}
        <Input
          id="name"
          label={t("name")}
          type="text"
          placeholder={t("enterConfigName")}
          required
          value={configName}
          onChange={(e) => setConfigName(e.target.value)}
        />
        {children && childrenPosition === "middle" && <>{children}</>}
        {properties.map((property) => (
          <PluginSettingProperty
            key={property.key}
            property={property}
            value={settings[property.key] || ""}
            onChange={(val) => handleChangeProperty(val, property)}
          />
        ))}
        {children && childrenPosition === "bottom" && <>{children}</>}
      </ModalBody>
      <ModalFooter>
        <Button type="submit" form="submit-config" isLoading={isLoading}>
          {submitLabel}
        </Button>
        <Button styleType="danger" onClick={onClose}>
          {t("close").toUpperCase()}
        </Button>
      </ModalFooter>
    </PageModal>
  )
}
