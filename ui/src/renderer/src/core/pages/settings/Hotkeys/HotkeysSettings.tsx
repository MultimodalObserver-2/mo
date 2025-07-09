import { useEffect, useState } from "react"
import Hotkey, { HotkeyProps } from "./Hotkey"
import SettingsGroup from "../SettingsGroup"

export default function HotkeysSettings() {
  const [hotkeys, setHotkeys] = useState<HotkeyProps[]>([])
  const [currentCombos, setCurrentCombos] = useState<Record<string, string>>({})

  useEffect(() => {
    window.core.hotkeys.disable()
    window.core.hotkeys.getAll().then((data) => {
      setHotkeys(data as HotkeyProps[])
      const initialCombos = Object.fromEntries(data.map((h) => [h.id, h.actualKey]))
      setCurrentCombos(initialCombos)
    })
    return () => window.core.hotkeys.enable()
  }, [])

  const handleComboChange = (id: string, newCombo: string) => {
    setCurrentCombos((prev) => ({ ...prev, [id]: newCombo }))
  }

  const getWarning = (id: string, combo: string) => {
    if (!combo) return undefined

    const currentHotkey = hotkeys.find((h) => h.id === id)
    if (!currentHotkey) return undefined

    const conflicts = hotkeys.filter((h) => {
      if (h.id === id) return false

      const otherCombo = currentCombos[h.id] ?? h.actualKey
      if (!otherCombo) return false

      if (otherCombo === combo) {
        const bothComplementary =
          h.type === "complementary" && currentHotkey.type === "complementary"
        const sameGroup = h.groupId && currentHotkey.groupId && h.groupId === currentHotkey.groupId
        if (bothComplementary && sameGroup) return false
        return true
      }
      return false
    })

    return conflicts.length > 0
      ? `Key used by: ${conflicts.map((c) => c.label).join(", ")}`
      : undefined
  }

  const handleOnSaved = () => {
    window.core.hotkeys.getAll().then((data) =>
      setHotkeys(
        (data as HotkeyProps[]).map((h) => ({
          ...h,
          currentCombo: currentCombos[h.id] ?? h.actualKey,
          onComboChange: handleComboChange,
          onSaved: () => {}
        }))
      )
    )
  }

  return (
    <SettingsGroup title="Hotkeys">
      {hotkeys.map((hk) => (
        <Hotkey
          key={hk.id}
          {...hk}
          warning={getWarning(hk.id, currentCombos[hk.id] ?? hk.actualKey)}
          onComboChange={handleComboChange}
          onSaved={handleOnSaved}
        />
      ))}
    </SettingsGroup>
  )
}
