import { useState, useEffect, useCallback } from "react"

const isModifier = (key: string) => {
  const modifiers = ["Control", "Shift", "Alt", "Meta"]
  return modifiers.includes(key)
}

const normalizeKey = (e: KeyboardEvent) => {
  if (e.code.startsWith("Digit")) return e.code.replace("Digit", "")
  if (e.code.startsWith("Key")) return e.code.replace("Key", "")
  if (e.key === " ") return "Space"
  if (e.key.length === 1 && !isModifier(e.key)) return e.key.toUpperCase()
  return e.key
}

export function useKeyCapture({ defaultKey = "" }: { readonly defaultKey?: string }) {
  const [combo, setCombo] = useState<string>(defaultKey)
  const [isCapturing, setIsCapturing] = useState<boolean>(false)
  const [currentModifiers, setCurrentModifiers] = useState<Set<string>>(new Set())

  const buildCombo = (modifiers: Set<string>, mainKey?: string) => {
    const sortedMods = Array.from(modifiers).sort()
    return mainKey ? [...sortedMods, mainKey].join("+") : [...sortedMods].join("+")
  }

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      e.preventDefault()

      const key = normalizeKey(e)

      const newModifiers = new Set(currentModifiers)
      if (isModifier(key)) {
        newModifiers.add(key)
        setCurrentModifiers(newModifiers)
        setCombo(buildCombo(newModifiers))
      } else {
        setCombo(buildCombo(newModifiers, key))
      }
    },
    [currentModifiers]
  )

  const handleKeyUp = useCallback(
    (e: KeyboardEvent) => {
      const key = normalizeKey(e)

      if (isModifier(key)) {
        const newModifiers = new Set(currentModifiers)
        newModifiers.delete(key)
        setCurrentModifiers(newModifiers)
      }
    },
    [currentModifiers]
  )

  const startCapture = () => setIsCapturing(true)
  const stopCapture = () => setIsCapturing(false)
  const resetCombo = () => {
    setCombo(defaultKey)
    setCurrentModifiers(new Set())
  }
  const clearCombo = () => {
    setCombo("")
    setCurrentModifiers(new Set())
  }

  useEffect(() => {
    if (!isCapturing) return

    window.addEventListener("keydown", handleKeyDown)
    window.addEventListener("keyup", handleKeyUp)

    return () => {
      window.removeEventListener("keydown", handleKeyDown)
      window.removeEventListener("keyup", handleKeyUp)
    }
  }, [isCapturing, handleKeyDown, handleKeyUp])

  return { combo, startCapture, stopCapture, resetCombo, clearCombo }
}
