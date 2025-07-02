/**
 * Enum representing all supported property types for plugin configuration forms.
 */
export enum PropertyType {
  NUMBER = "number",
  TEXT = "text",
  BOOL = "bool",
  PATH = "path",
  SELECT = "select"
}

/**
 * Represents a selectable option for the SELECT property type.
 * @property label - User-facing label for the option.
 * @property value - Internal value for the option.
 */
export type PropertySelectOption = {
  label: string
  value: string | number
}

/**
 * Callback signature for generating dynamic/conditional property definitions
 * based on current settings.
 * @param props - The Properties instance.
 * @param settings - Current settings.
 * @returns A dictionary of new or modified properties, or null if unchanged.
 */
export type ModifiedCallback = (
  props: Properties,
  settings: Record<string, unknown>
) => Record<string, Property> | null

/**
 * Represents a single configurable property for a plugin.
 *
 * Use this class to define input fields for plugin settings forms.
 * 
 * Attributes:
 * - `key`: Unique identifier for the property.
 * - `label`: Human-readable label for display in the UI.
 * - `required`: If true, this property must be provided for valid configuration (default: true).
 * - `visible`: If false, this property will be hidden from the UI (default: true).
 * - `enabled`: If false, this property will be disabled (read-only) in the UI (default: true).
 * - `default`: The default value for the property, if any.
 * - `data`: Arbitrary additional configuration (such as select options, file types, etc).
 */
export class Property {
  key: string
  label: string
  required = true
  visible = true
  enabled = true
  default?: unknown
  data: Record<string, unknown> = {}
  private readonly _type: PropertyType
  private _modifiedCallback?: ModifiedCallback

  /**
   * Creates a new Property instance.
   * @param key - Unique identifier for this property.
   * @param label - Display label for the UI.
   * @param type - The type of the property (e.g., number, text, select).
   * @param data - Optional extra data for property configuration.
   */
  constructor(key: string, label: string, type: PropertyType, data: Record<string, unknown> = {}) {
    this.key = key
    this.label = label
    this._type = type
    this.data = data
  }

  /**
   * Assigns a callback to make this property reactive to other settings.
   * Use this to implement conditional logic in dynamic forms.
   * @param callback - Function to be called when relevant settings change.
   */
  setModifiedCallback(callback: ModifiedCallback) {
    this._modifiedCallback = callback
  }

  /**
   * Returns the modified callback, if present.
   * @returns The callback function, or undefined.
   */
  getModifiedCallback(): ModifiedCallback | undefined {
    return this._modifiedCallback
  }

  /**
   * Returns the type of the property.
   * @returns The property type.
   */
  getType(): PropertyType {
    return this._type
  }

  /**
   * Converts the property to a plain JavaScript object, suitable for UI rendering or serialization.
   * @returns The property as a plain object.
   */
  toObject(): Record<string, unknown> {
    return {
      key: this.key,
      label: this.label,
      required: this.required,
      visible: this.visible,
      enabled: this.enabled,
      default: this.default,
      data: this.data,
      property_type: this._type,
      reactive: this._modifiedCallback !== undefined
    }
  }

  /**
   * Creates a deep clone of this property, including all settings and the modified callback.
   * @returns A new Property instance with identical configuration.
   */
  clone(): Property {
    const cloned = new Property(this.key, this.label, this._type, { ...this.data })
    cloned.required = this.required
    cloned.visible = this.visible
    cloned.enabled = this.enabled
    cloned.default = this.default
    if (this._modifiedCallback) {
      cloned.setModifiedCallback(this._modifiedCallback)
    }
    return cloned
  }
}

/**
 * Maps each PropertyType to a validation function for property values.
 * Used internally for runtime property validation.
 */
export const VALIDATORS: Record<
  PropertyType,
  (v: unknown, options?: PropertySelectOption[]) => boolean
> = {
  [PropertyType.NUMBER]: (v) => typeof v === "number",
  [PropertyType.TEXT]: (v) => typeof v === "string",
  [PropertyType.BOOL]: (v) => typeof v === "boolean",
  [PropertyType.PATH]: (v) => typeof v === "string",
  [PropertyType.SELECT]: (v, options = []) => options.some((opt) => opt.value === v)
}

/**
 * Collection and API for defining, managing, and validating plugin properties.
 * Use this class to declare all the configurable fields for your plugin's settings.
 */
export class Properties {
  private _properties: Record<string, Property> = {}

  /**
   * Adds a property of a given type.
   * @param key - Unique key for the property.
   * @param label - Human-readable label.
   * @param type - Property type.
   * @param data - Optional additional configuration data.
   * @throws Error if the property key already exists.
   * @internal
   */
  private _addProperty(
    key: string,
    label: string,
    type: PropertyType,
    data: Record<string, unknown> = {}
  ) {
    if (this._properties[key]) {
      throw new Error(`Property with key '${key}' already exists.`)
    }
    this._properties[key] = new Property(key, label, type, data)
  }

  /**
   * Adds a numeric property.
   * @param key - Unique key for the property.
   * @param label - Display label.
   * @param min - Optional minimum value.
   * @param max - Optional maximum value.
   * @param step - Optional step increment.
   */
  addNumber(key: string, label: string, min?: number, max?: number, step?: number) {
    const data: Record<string, unknown> = {}
    if (min !== undefined) data.min = min
    if (max !== undefined) data.max = max
    if (step !== undefined) data.step = step
    this._addProperty(key, label, PropertyType.NUMBER, data)
  }

  /**
   * Adds a text (string) property.
   * @param key - Unique key for the property.
   * @param label - Display label.
   * @param minLength - Optional minimum string length.
   * @param maxLength - Optional maximum string length.
   */
  addText(key: string, label: string, minLength?: number, maxLength?: number) {
    const data: Record<string, unknown> = {}
    if (minLength !== undefined) data.minLength = minLength
    if (maxLength !== undefined) data.maxLength = maxLength
    this._addProperty(key, label, PropertyType.TEXT, data)
  }

  /**
   * Adds a boolean property (checkbox/switch).
   * Defaults to false.
   * @param key - Unique key for the property.
   * @param label - Display label.
   */
  addBool(key: string, label: string) {
    this._addProperty(key, label, PropertyType.BOOL)
    this.setDefault(key, false)
  }

  /**
   * Adds a path property (file or directory).
   * @param key - Unique key for the property.
   * @param label - Display label.
   * @param fileTypes - Optional list of allowed file extensions.
   */
  addPath(key: string, label: string, fileTypes?: string[]) {
    const data: Record<string, unknown> = {}
    if (fileTypes) data.fileTypes = fileTypes
    this._addProperty(key, label, PropertyType.PATH, data)
  }

  /**
   * Adds a select (dropdown) property with predefined options.
   * @param key - Unique key for the property.
   * @param label - Display label.
   * @param options - List of selectable options.
   */
  addSelect(key: string, label: string, options: PropertySelectOption[]) {
    this._addProperty(key, label, PropertyType.SELECT, { options })
  }

  /**
   * Updates the available options for a select property at runtime.
   * @param key - Key of the select property.
   * @param options - New list of options.
   * @throws Error if the property does not exist or is not of SELECT type.
   */
  updateSelectOptions(key: string, options: PropertySelectOption[]) {
    const prop = this._properties[key]
    if (!prop || prop.getType() !== PropertyType.SELECT) {
      throw new Error(`Property '${key}' is not of type SELECT`)
    }
    prop.data.options = options
  }

  /**
   * Removes a property by key.
   * @param key - The property key to remove.
   * @throws Error if the property does not exist.
   */
  removeProperty(key: string) {
    if (!this._properties[key]) {
      throw new Error(`Property with key '${key}' does not exist.`)
    }
    delete this._properties[key]
  }

  /**
   * Sets the default value for a property.
   * @param key - The property key.
   * @param value - The default value.
   * @throws Error if the property does not exist.
   */
  setDefault(key: string, value: unknown) {
    this.ensureExists(key)
    this._properties[key].default = value
  }

  /**
   * Enables or disables a property.
   * @param key - The property key.
   * @param enabled - Whether the property should be enabled.
   * @throws Error if the property does not exist.
   */
  setEnabled(key: string, enabled: boolean) {
    this.ensureExists(key)
    this._properties[key].enabled = enabled
  }

  /**
   * Sets the visibility of a property.
   * @param key - The property key.
   * @param visible - Whether the property should be visible in the UI.
   * @throws Error if the property does not exist.
   */
  setVisible(key: string, visible: boolean) {
    this.ensureExists(key)
    this._properties[key].visible = visible
  }

  /**
   * Sets whether a property is required for valid configuration.
   * @param key - The property key.
   * @param required - Whether the property is required.
   * @throws Error if the property does not exist.
   */
  setRequired(key: string, required: boolean) {
    this.ensureExists(key)
    this._properties[key].required = required
  }

  /**
   * Assigns a modified callback to a property for dynamic behavior.
   * @param key - The property key.
   * @param callback - The callback function.
   * @throws Error if the property does not exist.
   */
  setModifiedCallback(key: string, callback: ModifiedCallback) {
    this.ensureExists(key)
    this._properties[key].setModifiedCallback(callback)
  }

  /**
   * Returns a property by key, or undefined if not found.
   * @param key - The property key.
   * @returns The Property instance or undefined.
   */
  getProperty(key: string): Property | undefined {
    return this._properties[key]
  }

  /**
   * Checks if a property with the given key exists.
   * @param key - The property key.
   * @returns True if the property exists, false otherwise.
   */
  hasProperty(key: string): boolean {
    return key in this._properties
  }

  /**
   * Gets the property type for a given property key.
   * @param key - The property key.
   * @returns The property type.
   * @throws Error if the property does not exist.
   */
  getType(key: string): PropertyType {
    this.ensureExists(key)
    return this._properties[key].getType()
  }

  /**
   * Clones all properties for internal use, preserving dynamic behaviors.
   * @returns A new record of Property instances.
   * @internal
   */
  private cloneProperties(): Record<string, Property> {
    const newProps: Record<string, Property> = {}

    for (const key in this._properties) {
      newProps[key] = this._properties[key].clone()
    }

    return newProps
  }

  /**
   * Gets all properties, optionally applying modified callbacks based on current settings.
   * Use this to build the property list for a dynamic settings form.
   * @param settings - Optional user-supplied values to apply modified callbacks.
   * @returns An array of Property instances, sorted by insertion order.
   */
  getProperties(settings?: Record<string, unknown>): Property[] {
    const copy = this.cloneProperties()

    if (!settings) {
      return Object.values(copy)
    }

    for (const key of Object.keys(settings)) {
      const prop = copy[key]
      const callback = prop?.getModifiedCallback()
      if (callback) {
        const newProps = callback(this, settings)
        if (newProps) {
          Object.assign(copy, newProps)
        }
      }
    }

    return Object.values(copy)
  }

  /**
   * Gets all properties as plain objects for rendering or serialization.
   * @param settings - Optional settings for dynamic properties.
   * @returns An array of plain objects.
   */
  getPropertiesDict(settings?: Record<string, unknown>): Record<string, unknown>[] {
    return this.getProperties(settings).map((prop) => prop.toObject())
  }

  /**
   * Gets all default values for properties as a dictionary.
   * Only includes properties with an explicit default set.
   * @returns Record of default values, keyed by property key.
   */
  getDefaultValues(): Record<string, unknown> {
    const result: Record<string, unknown> = {}
    for (const [key, prop] of Object.entries(this._properties)) {
      if (prop.default !== undefined) {
        result[key] = prop.default
      }
    }
    return result
  }

  /**
   * Validates the user-supplied settings against all property definitions.
   * Throws if any property is missing, required, or fails type/option validation.
   * @param settings - The user's configuration values.
   * @returns True if all settings are valid.
   * @throws Error if validation fails.
   */
  validate(settings: Record<string, unknown>): boolean {
    for (const prop of this.getProperties(settings)) {
      this.validateProperty(prop, settings)
    }
    return true
  }

  /**
   * Validates a single property value against its type, requirement, and select options.
   * @param prop - The property to validate.
   * @param settings - The user's configuration values.
   * @throws Error if the property is required but missing, or if the value is invalid.
   */
  validateProperty(prop: Property, settings: Record<string, unknown>) {
    const key = prop.key
    const value = settings[key]

    if (prop.required && !(key in settings)) {
      throw new Error(`Property '${key}' is required.`)
    }

    if (prop.enabled && key in settings) {
      const validator = VALIDATORS[prop.getType()]
      if (!validator) {
        throw new Error(`No validator for type '${prop.getType()}'`)
      }

      if (prop.getType() === PropertyType.SELECT) {
        const options = (prop.data.options as PropertySelectOption[]) || []
        if (!validator(value, options)) {
          throw new Error(`Property '${key}' must be one of the valid options.`)
        }
      } else if (!validator(value)) {
        throw new Error(`Property '${key}' must be of type '${prop.getType()}'`)
      }
    }
  }

  /**
   * Throws an error if a property with the given key does not exist.
   * @param key - The property key to check.
   * @throws Error if the property does not exist.
   * @internal
   */
  private ensureExists(key: string) {
    if (!this._properties[key]) {
      throw new Error(`Property with key '${key}' does not exist.`)
    }
  }
}
