import { useEffect, useState } from "react"
import Hotkey, { HotkeyProps } from "./Hotkey"
import SettingsGroup from "../SettingsGroup"
import { useTranslation } from "react-i18next"

export default function HotkeysSettings() {
  const { t, i18n } = useTranslation("core", { keyPrefix: "pages.settings.hotkeys" })
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

  function handleHotkeysLoaded(data) {
    setHotkeys((data as HotkeyProps[]).map(augmentHotkey))
  }

  function augmentHotkey(h: HotkeyProps): HotkeyProps {
    return {
      ...h,
      currentCombo: currentCombos[h.id] ?? h.actualKey,
      onComboChange: handleComboChange,
      onSaved: () => {}
    } as HotkeyProps
  }

  useEffect(() => {
    const handleLanguageChanged = () => {
      window.core.hotkeys.getAll().then(handleHotkeysLoaded)
    }

    i18n.on("languageChanged", handleLanguageChanged)
    return () => {
      i18n.off("languageChanged", handleLanguageChanged)
    }
  }, [currentCombos, i18n])

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
    window.core.hotkeys.getAll().then(handleHotkeysLoaded)
  }

  return (
    <SettingsGroup title={t("title")}>
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
