import styles from "./configure-plugin.module.css"
import {
  PluginProperty,
  PluginPropertyTypes,
  PropertyDataNumber,
  PropertyDataPath,
  PropertyDataSelect,
  PropertyDataText
} from "@renderer/core/types/PluginProperty"
import Input from "../input/Input"
import Checkbox from "../checkbox/Checkbox"
import PathInput from "../path-input/PathInput"
import Select from "../select/Select"

export default function PluginSettingProperty({
  property,
  value,
  onChange
}: {
  readonly property: PluginProperty
  value?: string | number | boolean
  onChange?: (newValue) => void
}) {
  if (!property.visible) {
    return <></>
  }

  if (value != undefined) {
    property.default = undefined
  }

  if (
    property.property_type === PluginPropertyTypes.INT ||
    property.property_type === PluginPropertyTypes.FLOAT
  ) {
    const data = property.data as PropertyDataNumber
    const defaultValue = property.default as number | undefined
    return (
      <Input
        id={property.key}
        boxClassName={property.visible ? "" : styles.invisible}
        label={property.label}
        type="number"
        required={property.required}
        disabled={!property.enabled}
        min={data.min}
        max={data.max}
        step={data.step}
        value={typeof value === "boolean" ? "" : value}
        defaultValue={defaultValue}
        onChange={(e) => {
          onChange?.(e.target.valueAsNumber)
        }}
      />
    )
  } else if (property.property_type === PluginPropertyTypes.TEXT) {
    const data = property.data as PropertyDataText
    const defaultValue = property.default as string | undefined
    return (
      <Input
        id={property.key}
        label={property.label}
        type="text"
        required={property.required}
        disabled={!property.enabled}
        minLength={data.min_length}
        maxLength={data.max_length}
        value={typeof value === "boolean" ? "" : value}
        defaultValue={defaultValue}
        onChange={(e) => {
          onChange?.(e.target.value)
        }}
      />
    )
  } else if (property.property_type === PluginPropertyTypes.BOOL) {
    const defaultValue = property.default as boolean
    return (
      <Checkbox
        id={property.key}
        defaultChecked={defaultValue}
        checked={value as boolean}
        onChange={(e) => {
          onChange?.(e.target.checked)
        }}
      >
        {property.label}
      </Checkbox>
    )
  } else if (property.property_type === PluginPropertyTypes.PATH) {
    const data = property.data as PropertyDataPath
    const defaultValue = property.default as string | undefined
    return (
      <PathInput
        id={property.key}
        label={property.label}
        type="text"
        required={property.required}
        disabled={!property.enabled}
        fileTypes={data.file_types}
        value={typeof value === "boolean" ? "" : value}
        defaultValue={defaultValue}
        onChange={(e) => {
          onChange?.(e.target.value)
        }}
      />
    )
  } else if (property.property_type === PluginPropertyTypes.SELECT) {
    const data = property.data as PropertyDataSelect
    const defaultValue = property.default as string | undefined
    return (
      <Select
        id={property.key}
        label={property.label}
        required={property.required}
        disabled={!property.enabled}
        value={typeof value === "boolean" ? "" : value}
        defaultValue={defaultValue}
        onChange={(e) => {
          onChange?.(e.target.value)
        }}
      >
        {data.options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </Select>
    )
  } else {
    return <div>Unknown property type</div>
  }
}
