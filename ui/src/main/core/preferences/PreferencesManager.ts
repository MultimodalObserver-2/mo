import * as fs from "fs"
import * as path from "path"
import { getMainAppPath } from "../appPaths"

type Preferences = Record<string, unknown>

export class PreferencesManager {
  private preferences: Preferences = {}
  private preferencesPath: string

  constructor(filename = "preferences.json") {
    this.preferencesPath = path.join(getMainAppPath(), filename)
    this.load()
  }

  private load(): void {
    try {
      if (!fs.existsSync(this.preferencesPath)) {
        fs.writeFileSync(this.preferencesPath, JSON.stringify({}, null, 2))
      }

      const data = fs.readFileSync(this.preferencesPath, "utf-8")
      this.preferences = JSON.parse(data)
    } catch (error) {
      console.error("Failed to load preferences:", error)
      this.preferences = {}
    }
  }

  private save(): void {
    try {
      fs.writeFileSync(this.preferencesPath, JSON.stringify(this.preferences, null, 2))
    } catch (error) {
      console.error("Failed to save preferences:", error)
    }
  }

  public get<T = unknown>(key: string): T | undefined {
    return this.preferences[key] as T | undefined
  }

  public set<T = unknown>(key: string, value: T): void {
    this.preferences[key] = value
    this.save()
  }

  public remove(key: string): void {
    delete this.preferences[key]
    this.save()
  }

  public getAll(): Preferences {
    return { ...this.preferences }
  }

  public reset(): void {
    this.preferences = {}
    this.save()
  }

  public has(key: string): boolean {
    return Object.prototype.hasOwnProperty.call(this.preferences, key)
  }

  public extend(key: string, partialValue: Record<string, unknown>): void {
    const current = this.preferences[key] || {}
    if (typeof current !== "object" || current === null) {
      this.preferences[key] = {}
    }

    this.preferences[key] = {
      ...current,
      ...partialValue
    }

    this.save()
  }
}

const preferencesManager = new PreferencesManager()
export default preferencesManager
