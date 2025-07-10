import styles from "./options.module.css"
import { useEffect, useState } from "react"
import Checkbox from "@renderer/core/components/checkbox/Checkbox"
import SettingsGroup from "../SettingsGroup"

interface Option {
  id: string
  label: string
  value: boolean
}

export default function Options() {
  const [options, setOptions] = useState<Option[]>([])

  useEffect(() => {
    window.core.options.getAll().then(setOptions)
  }, [])

  const handleChange = (id: string, checked: boolean) => {
    window.core.options.set(id, checked)
    setOptions((options) =>
      options.map((opt) => (opt.id === id ? { ...opt, value: checked } : opt))
    )
  }

  return (
    <SettingsGroup title="Options">
      {options.map((opt) => (
        <Checkbox
          key={opt.id}
          styleType="secondary"
          borderRadius="sm"
          checked={!!opt.value}
          onChange={(e) => handleChange(opt.id, e.target.checked)}
        >
          <span className={styles.label}>{opt.label}</span>
        </Checkbox>
      ))}
    </SettingsGroup>
  )
}
