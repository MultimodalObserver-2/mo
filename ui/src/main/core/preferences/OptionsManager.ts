import preferencesManager from "./PreferencesManager"

export type OptionType = "boolean"

// type OptionValue = boolean

export interface OptionDefinition<T = boolean> {
  id: string
  label: string
  type: OptionType
  defaultValue: T
}

export interface Option {
  id: string
  label: string
  type: OptionType
  value: boolean
}

export class OptionsManager {
  private readonly definitions = new Map<string, OptionDefinition>()
  private readonly storageKey = "options"
  private values: Record<string, boolean> = {}

  constructor() {
    this.values = preferencesManager.get<Record<string, boolean>>(this.storageKey) || {}
  }

  registerOption(option: OptionDefinition): void {
    this.definitions.set(option.id, option)
    if (!(option.id in this.values)) {
      this.set(option.id, option.defaultValue)
    }
  }

  updateOption(id: string, newDefinition: Partial<OptionDefinition>): void {
    const existing = this.definitions.get(id)
    if (!existing) {
      throw new Error(`Option with id "${id}" does not exist`)
    }
    const updatedDefinition: OptionDefinition = {
      ...existing,
      ...newDefinition
    }
    this.definitions.set(id, updatedDefinition)

    if (!(id in this.values)) {
      this.set(id, updatedDefinition.defaultValue)
    }
  }

  get(id: string): boolean | undefined {
    if (id in this.values) return this.values[id]
    const def = this.definitions.get(id)
    return def ? def.defaultValue : undefined
  }

  set(id: string, value: boolean): void {
    this.values[id] = value
    preferencesManager.set(this.storageKey, this.values)
  }

  getAll(): Array<Option> {
    return Array.from(this.definitions.values()).map((def) => ({
      ...def,
      value: this.values[def.id] ?? def.defaultValue
    }))
  }
}

const optionsManager = new OptionsManager()
export default optionsManager
