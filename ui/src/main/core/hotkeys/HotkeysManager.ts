import { app, globalShortcut } from "electron"
import preferencesManager from "../preferences/PreferencesManager"

export type SimpleHotkeyAction = {
  id: string
  label: string
  defaultKey?: string
  callback: () => void | Promise<void>
}

export type ComplementaryHotkeyAction = {
  id: string
  actions: SimpleHotkeyAction[]
  getState: () => number | Promise<number>
}

export type HotkeyAction =
  | { type: "simple"; action: SimpleHotkeyAction }
  | { type: "complementary"; action: ComplementaryHotkeyAction }

type HotkeysPreferences = Record<string, string>

interface HotkeyStatus {
  id: string
  label: string
  actualKey: string
  defaultKey?: string
  type: "simple" | "complementary"
  groupId?: string
}

export class HotkeysManager {
  private readonly storageKey = "hotkeys"
  private simpleActions: Map<string, SimpleHotkeyAction> = new Map()
  private complementaryActions: Map<string, { group: ComplementaryHotkeyAction; index: number }> =
    new Map()
  private hotkeys: HotkeysPreferences = {}
  private registeredKeys: Map<string, string> = new Map()
  private enabled = true

  constructor() {
    this.hotkeys = preferencesManager.get<HotkeysPreferences>(this.storageKey) || {}
    if (app.isReady()) {
      this.registerAllShortcuts()
    } else {
      app.on("ready", () => this.registerAllShortcuts())
    }
  }

  public registerAction(hotkeyAction: HotkeyAction): void {
    if (hotkeyAction.type === "simple") {
      const action = hotkeyAction.action
      this.simpleActions.set(action.id, action)
      this.registerShortcut(action.id)
    } else if (hotkeyAction.type === "complementary") {
      const group = hotkeyAction.action
      group.actions.forEach((action, index) => {
        this.complementaryActions.set(action.id, { group, index })
        this.registerShortcut(action.id)
      })
    }
  }

  public updateLabel(actionId: string, label: string): void {
    if (this.simpleActions.has(actionId)) {
      const action = this.simpleActions.get(actionId)!
      action.label = label
    } else if (this.complementaryActions.has(actionId)) {
      const comp = this.getComplementaryPart(actionId)
      if (comp) {
        comp.group.actions[comp.index].label = label
      }
    }
  }

  public getHotkey(actionId: string): string {
    const userKey = this.hotkeys[actionId]
    const action =
      this.simpleActions.get(actionId) ||
      this.getComplementaryPart(actionId)?.group.actions[this.getComplementaryPart(actionId)!.index]
    const defaultKey = action?.defaultKey ?? ""
    return userKey ?? defaultKey
  }

  public setHotkey(actionId: string, keyCombination: string): boolean {
    if (!this.simpleActions.has(actionId) && !this.complementaryActions.has(actionId)) return false

    const success = this.registerShortcut(actionId, keyCombination)
    if (success) {
      this.hotkeys[actionId] = keyCombination
      this.save()
    }
    return success
  }

  public resetHotkey(actionId: string): void {
    delete this.hotkeys[actionId]
    this.save()
    this.registerShortcut(actionId)
  }

  public async getAll(): Promise<HotkeyStatus[]> {
    const result: HotkeyStatus[] = []

    this.simpleActions.forEach((action) => {
      const key = this.getHotkey(action.id)
      result.push({
        id: action.id,
        label: action.label,
        actualKey: key,
        defaultKey: action.defaultKey ?? "",
        type: "simple"
      })
    })

    const seenGroups = new Set<string>()
    for (const { group } of this.complementaryActions.values()) {
      if (seenGroups.has(group.id)) continue
      seenGroups.add(group.id)
      for (let i = 0; i < group.actions.length; i++) {
        const action = group.actions[i]
        const key = this.getHotkey(action.id)
        result.push({
          id: action.id,
          label: action.label,
          actualKey: key,
          defaultKey: action.defaultKey ?? "",
          type: "complementary",
          groupId: group.id
        })
      }
    }

    return result
  }

  private async triggerAction(actionId: string): Promise<void> {
    if (this.simpleActions.has(actionId)) {
      await this.simpleActions.get(actionId)!.callback()
    } else {
      const comp = this.getComplementaryPart(actionId)
      if (!comp) return
      const index = await comp.group.getState()
      const action = comp.group.actions[index]
      await action.callback()
    }
  }

  private registerShortcut(actionId: string, keyOverride?: string): boolean {
    const key = keyOverride ?? this.getHotkey(actionId)
    const oldKey = this.registeredKeys.get(actionId)

    if (!app.isReady()) return false

    if (oldKey && oldKey !== key) {
      globalShortcut.unregister(oldKey)
      this.registeredKeys.delete(actionId)
    }

    if (key === "") {
      this.registeredKeys.set(actionId, "")
      return true
    }

    if (!key) return false

    const exists = Array.from(this.registeredKeys.entries()).some(
      ([otherId, otherKey]) => otherKey === key && otherId !== actionId
    )

    if (!exists || this.registeredKeys.get(actionId) !== key) {
      const success = globalShortcut.register(key, () => this.triggerAction(actionId))
      if (!this.enabled) {
        globalShortcut.unregister(key)
      }
      if (success) {
        this.registeredKeys.set(actionId, key)
        return true
      }
    }
    return false
  }

  private registerAllShortcuts(): void {
    if (!this.enabled) return
    this.simpleActions.forEach((_, id) => this.registerShortcut(id))
    this.complementaryActions.forEach(({ group }) => {
      group.actions.forEach((a) => this.registerShortcut(a.id))
    })
  }

  private getComplementaryPart(
    actionId: string
  ): { group: ComplementaryHotkeyAction; index: number } | undefined {
    return this.complementaryActions.get(actionId)
  }

  private save(): void {
    preferencesManager.set(this.storageKey, this.hotkeys)
  }

  public unregisterAll(): void {
    globalShortcut.unregisterAll()
    this.registeredKeys.clear()
  }

  public disable(): void {
    this.enabled = false
    globalShortcut.unregisterAll()
  }

  public enable(): void {
    this.enabled = true
    this.registerAllShortcuts()
  }
}

const hotkeysManager = new HotkeysManager()
export default hotkeysManager
