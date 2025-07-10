import preferencesManager from "./PreferencesManager"

export type OptionType = "boolean"

type OptionValue = boolean

export interface OptionDefinition<T = OptionValue> {
  id: string
  label: string
  type: OptionType
  defaultValue: T
}

export interface Option {
  id: string
  label: string
  type: OptionType
  value: OptionValue
}

export class OptionsManager {
  private definitions = new Map<string, OptionDefinition>()
  private readonly storageKey = "options"
  private values: Record<string, OptionValue> = {}

  constructor() {
    this.values = preferencesManager.get<Record<string, OptionValue>>(this.storageKey) || {}
  }

  registerOption(option: OptionDefinition): void {
    this.definitions.set(option.id, option)
    if (!(option.id in this.values)) {
      this.set(option.id, option.defaultValue)
    }
  }

  get(id: string): OptionValue | undefined {
    if (id in this.values) return this.values[id]
    const def = this.definitions.get(id)
    return def ? def.defaultValue : undefined
  }

  set(id: string, value: OptionValue): void {
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
