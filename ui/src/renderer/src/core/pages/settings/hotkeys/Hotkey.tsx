import styles from "./hotkey.module.css"
import Input from "@renderer/core/components/input/Input"
import { useKeyCapture } from "./useKeyCapture"
import Button from "@renderer/core/components/button/Button"
import UndoIcon from "@renderer/core/components/icons/UndoIcon"
import BackspaceIcon from "@renderer/core/components/icons/BackspaceIcon"
import SaveIcon from "@renderer/core/components/icons/SaveIcon"
import { useEffect } from "react"
import { showApiErrorMessage } from "@renderer/core/utils/dialogMessages"
import WarningIcon from "@renderer/core/components/icons/WarningIcon"
import { useTranslation } from "react-i18next"

export interface HotkeyProps {
  id: string
  label: string
  actualKey: string
  type: "simple" | "complementary"
  groupId?: string
  warning?: string
  onComboChange: (id: string, newCombo: string) => void
  onSaved: () => void
}

export default function Hotkey({
  id,
  label,
  actualKey,
  warning,
  onComboChange,
  onSaved
}: Readonly<HotkeyProps>) {
  const { t } = useTranslation("core", { keyPrefix: "pages.settings.hotkeys.hotkey" })
  const { combo, startCapture, stopCapture, resetCombo, clearCombo } = useKeyCapture({
    defaultKey: actualKey
  })

  useEffect(() => {
    onComboChange(id, combo)
  }, [combo])

  const handleSave = async () => {
    try {
      const success = await window.core.hotkeys.set(id, combo)
      if (!success) {
        showApiErrorMessage(Error(t("errors.setFailed", { label })))
        return
      }
    } catch {
      showApiErrorMessage(Error(t("errors.invalidCombo", { combo, label })))
    }
    onSaved()
  }

  const isValidCombo = (c: string) => {
    const modifiers = ["Control", "Alt", "Shift", "Meta"]
    const parts = c.split("+").map((x) => x.trim())
    return parts.some((p) => !modifiers.includes(p))
  }

  return (
    <article className={styles.container}>
      <label className={styles.hotkey}>
        <h4 className={styles.label}>{label}</h4>
        <div className={styles["input-container"]}>
          <Input
            styleType="primary"
            className={styles.input}
            value={combo}
            placeholder={t("placeholder")}
            readOnly
            onFocus={startCapture}
            onBlur={stopCapture}
          />
          {warning && (
            <abbr title={warning} className={styles.warn}>
              <WarningIcon className={styles["warning-icon"]} />
            </abbr>
          )}
        </div>
      </label>
      <div className={styles.actions}>
        <Button
          title={t("actions.save")}
          styleType="extra-soft"
          className={styles.action}
          onClick={handleSave}
          disabled={combo === actualKey || !isValidCombo(combo)}
        >
          <SaveIcon className={styles.icon} />
        </Button>
        <Button
          title={t("actions.reset")}
          styleType="extra-soft"
          className={styles.action}
          onClick={resetCombo}
          disabled={combo === actualKey}
        >
          <UndoIcon className={styles.icon} />
        </Button>
        <Button
          title={t("actions.clear")}
          styleType="extra-soft"
          className={styles.action}
          onClick={clearCombo}
        >
          <BackspaceIcon className={styles.icon} />
        </Button>
      </div>
    </article>
  )
}
