export enum PropertyType {
  NUMBER = "number",
  TEXT = "text",
  BOOL = "bool",
  PATH = "path",
  SELECT = "select"
}

export type PropertySelectOption = {
  label: string
  value: string | number
}

export type ModifiedCallback = (
  props: Properties,
  settings: Record<string, unknown>
) => Record<string, Property> | null

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

  constructor(key: string, label: string, type: PropertyType, data: Record<string, unknown> = {}) {
    this.key = key
    this.label = label
    this._type = type
    this.data = data
  }

  setModifiedCallback(callback: ModifiedCallback) {
    this._modifiedCallback = callback
  }

  getModifiedCallback(): ModifiedCallback | undefined {
    return this._modifiedCallback
  }

  getType(): PropertyType {
    return this._type
  }

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

export class Properties {
  private _properties: Record<string, Property> = {}

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

  addNumber(key: string, label: string, min?: number, max?: number, step?: number) {
    const data: Record<string, unknown> = {}
    if (min !== undefined) data.min = min
    if (max !== undefined) data.max = max
    if (step !== undefined) data.step = step
    this._addProperty(key, label, PropertyType.NUMBER, data)
  }

  addText(key: string, label: string, minLength?: number, maxLength?: number) {
    const data: Record<string, unknown> = {}
    if (minLength !== undefined) data.minLength = minLength
    if (maxLength !== undefined) data.maxLength = maxLength
    this._addProperty(key, label, PropertyType.TEXT, data)
  }

  addBool(key: string, label: string) {
    this._addProperty(key, label, PropertyType.BOOL)
    this.setDefault(key, false)
  }

  addPath(key: string, label: string, fileTypes?: string[]) {
    const data: Record<string, unknown> = {}
    if (fileTypes) data.fileTypes = fileTypes
    this._addProperty(key, label, PropertyType.PATH, data)
  }

  addSelect(key: string, label: string, options: PropertySelectOption[]) {
    this._addProperty(key, label, PropertyType.SELECT, { options })
  }

  updateSelectOptions(key: string, options: PropertySelectOption[]) {
    const prop = this._properties[key]
    if (!prop || prop.getType() !== PropertyType.SELECT) {
      throw new Error(`Property '${key}' is not of type SELECT`)
    }
    prop.data.options = options
  }

  removeProperty(key: string) {
    if (!this._properties[key]) {
      throw new Error(`Property with key '${key}' does not exist.`)
    }
    delete this._properties[key]
  }

  setDefault(key: string, value: unknown) {
    this.ensureExists(key)
    this._properties[key].default = value
  }

  setEnabled(key: string, enabled: boolean) {
    this.ensureExists(key)
    this._properties[key].enabled = enabled
  }

  setVisible(key: string, visible: boolean) {
    this.ensureExists(key)
    this._properties[key].visible = visible
  }

  setRequired(key: string, required: boolean) {
    this.ensureExists(key)
    this._properties[key].required = required
  }

  setModifiedCallback(key: string, callback: ModifiedCallback) {
    this.ensureExists(key)
    this._properties[key].setModifiedCallback(callback)
  }

  getProperty(key: string): Property | undefined {
    return this._properties[key]
  }

  hasProperty(key: string): boolean {
    return key in this._properties
  }

  getType(key: string): PropertyType {
    this.ensureExists(key)
    return this._properties[key].getType()
  }

  private cloneProperties(): Record<string, Property> {
    const newProps: Record<string, Property> = {}

    for (const key in this._properties) {
      newProps[key] = this._properties[key].clone()
    }

    return newProps
  }

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

  getPropertiesDict(settings?: Record<string, unknown>): Record<string, unknown>[] {
    return this.getProperties(settings).map((prop) => prop.toObject())
  }

  getDefaultValues(): Record<string, unknown> {
    const result: Record<string, unknown> = {}
    for (const [key, prop] of Object.entries(this._properties)) {
      if (prop.default !== undefined) {
        result[key] = prop.default
      }
    }
    return result
  }

  validate(settings: Record<string, unknown>): boolean {
    for (const prop of this.getProperties(settings)) {
      this.validateProperty(prop, settings)
    }
    return true
  }

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

  private ensureExists(key: string) {
    if (!this._properties[key]) {
      throw new Error(`Property with key '${key}' does not exist.`)
    }
  }
}
