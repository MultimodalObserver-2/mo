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

type PluginSettingPropertyProps = {
  /** The configuration object that defines the property's type, label, and constraints. */
  property: PluginProperty
  /** The current value of the property. Providing this makes the component "controlled". */
  value?: string | number | boolean
  /** Callback function triggered when the property's value changes. */
  onChange?: (newValue: string | number | boolean) => void
}

/**
 * Renders a specific form input control based on the configuration of a plugin property.
 * This component acts as a dynamic renderer for different types of settings.
 *
 * @param {PluginProperty} props.property - The configuration object for the setting.
 * @param {string | number | boolean} [props.value] - The current value, making it a controlled component.
 * If undefined, the component will use the `property.default` value.
 * @param {(newValue: string | number | boolean) => void} [props.onChange] - The callback to handle value changes.
 * @returns {React.ReactElement | null} The appropriate form input, or null if the property is not visible.
 */
export default function PluginSettingProperty({
  property,
  value,
  onChange
}: Readonly<PluginSettingPropertyProps>) {
  if (!property.visible) {
    return null
  }

  if (value != undefined) {
    property.default = undefined
  }

  const invisibleClass = property.visible ? "" : styles.invisible
  const finalValue = typeof value === "boolean" ? String(value) : value

  if (
    property.property_type === PluginPropertyTypes.INT ||
    property.property_type === PluginPropertyTypes.FLOAT
  ) {
    const data = property.data as PropertyDataNumber
    const defaultValue = property.default as number | undefined
    return (
      <Input
        id={property.key}
        boxClassName={invisibleClass}
        label={property.label}
        type="number"
        required={property.required}
        disabled={!property.enabled}
        min={data.min}
        max={data.max}
        step={data.step}
        value={finalValue}
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
        boxClassName={invisibleClass}
        label={property.label}
        type="text"
        required={property.required}
        disabled={!property.enabled}
        minLength={data.min_length}
        maxLength={data.max_length}
        value={finalValue}
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
        className={invisibleClass}
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
        boxClassName={invisibleClass}
        label={property.label}
        type="text"
        required={property.required}
        disabled={!property.enabled}
        fileTypes={data.file_types}
        value={finalValue}
        defaultValue={defaultValue}
        onChange={(e) => {
          onChange?.(e.target.value)
        }}
      />
    )
  } else if (property.property_type === PluginPropertyTypes.SELECT) {
    const data = property.data as PropertyDataSelect
    const defaultValue = property.default as string | undefined
    // Create a map to look up the original value type (string, number, or boolean) from the option's string value.
    const valueMap = new Map<string, string | number | boolean>()
    data.options.forEach((option) => {
      valueMap.set(String(option.value), option.value)
    })

    return (
      <Select
        id={property.key}
        boxClassName={invisibleClass}
        label={property.label}
        required={property.required}
        disabled={!property.enabled}
        value={finalValue}
        defaultValue={defaultValue}
        onChange={(e) => {
          // Retrieve the original typed value from the map before calling onChange.
          const selectedValue = valueMap.get(e.target.value) ?? e.target.value
          onChange?.(selectedValue)
        }}
      >
        {data.options.map((option) => (
          <option key={String(option.value)} value={String(option.value)}>
            {option.label}
          </option>
        ))}
      </Select>
    )
  }

  // Render nothing for an unknown property type to avoid breaking the UI.
  return null
}
