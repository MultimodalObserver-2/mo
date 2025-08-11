import { useEffect, useState } from "react"
import Hotkey, { HotkeyProps } from "./Hotkey"
import SettingsGroup from "../SettingsGroup"
import { useTranslation } from "react-i18next"

export default function HotkeysSettings() {
  const { t, i18n } = useTranslation("core", { keyPrefix: "pages.settings.hotkeys" })
  const [hotkeys, setHotkeys] = useState<HotkeyProps[]>([])
  const [currentCombos, setCurrentCombos] = useState<Record<string, string>>({})

  useEffect(() => {
    window.core.hotkeys.getAll().then((data) => {
      setHotkeys(data as HotkeyProps[])
      const initialCombos = Object.fromEntries(data.map((h) => [h.id, h.actualKey]))
      setCurrentCombos(initialCombos)
    })
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

  const isShiftLetterOnly = (combo: string) => {
    const parts = combo.split("+").map((x) => x.trim())
    return (
      parts.length === 2 &&
      parts[0] === "Shift" &&
      parts[1].length === 1 &&
      /^[a-zA-Z]$/.test(parts[1])
    )
  }

  const isReservedCombo = (combo: string) => {
    const RESERVED_LIST = [
      "Alt+Tab",
      "Alt+Shift+Tab",
      "Alt+F4",
      "Alt+Escape",
      "Control+Alt+Delete",
      "Control+Shift+Escape",
      "Control+Escape",
      "Meta+D",
      "Meta+Tab",
      "Meta+Shift+Tab",
      "Meta+E",
      "Meta+I",
      "Meta+L",
      "Meta+P",
      "Meta+R",
      "Meta+Space",
      "Meta+Tab",
      "Meta+ArrowLeft",
      "Meta+ArrowRight",
      "Meta+ArrowUp",
      "Meta+ArrowDown",
      "Control+C",
      "Control+V",
      "Control+X",
      "Control+Z",
      "Control+Y",
      "Control+A",
      "Control+S",
      "Control+P",
      "Control+N",
      "Control+F",
      "Control+W",
      "Control+T",
      "Control+Tab",
      "Control+Shift+Tab",
      "Control+Space"
    ]

    return RESERVED_LIST.includes(combo)
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

    const warnings: string[] = []

    if (isShiftLetterOnly(combo)) {
      warnings.push(t("warnings.shiftLetterOnly"))
    }

    if (isReservedCombo(combo)) {
      warnings.push(t("warnings.reservedCombo", { combo }))
    }

    if (conflicts.length > 0) {
      warnings.push(t("warnings.keyUsedBy", { labels: conflicts.map((c) => c.label).join(", ") }))
    }

    return warnings.length > 0 ? warnings.join(", ") : undefined
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
