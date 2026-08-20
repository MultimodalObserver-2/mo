import { useEffect, useRef, useState } from "react"
import Select from "@renderer/core/components/select/Select"
import pluginRepositoryService from "@renderer/core/services/PluginRepositoryService"
import {
  MAX_TAGS_PER_SEARCH,
  PLUGIN_CATEGORIES,
  PluginCategory,
  RepositoryTag
} from "@renderer/core/types/RepositoryPlugin"
import styles from "./repository-filters.module.css"

interface RepositoryFiltersProps {
  category?: PluginCategory
  onCategoryChange: (category?: PluginCategory) => void
  selectedTags: string[]
  onTagsChange: (tags: string[]) => void
  t: (key: string) => string
  /**
   * Looks up tags by prefix for the autocomplete. Defaults to the repository service, so the
   * component owns no data source of its own. Must be a stable reference: it is a dependency
   * of the debounced effect below.
   */
  searchTags?: (query: string) => Promise<RepositoryTag[]>
}

export default function RepositoryFilters({
  category,
  onCategoryChange,
  selectedTags,
  onTagsChange,
  t,
  searchTags = pluginRepositoryService.searchTags
}: RepositoryFiltersProps) {
  const [tagInput, setTagInput] = useState("")
  const [suggestions, setSuggestions] = useState<RepositoryTag[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const reqSeq = useRef(0)

  const maxReached = selectedTags.length >= MAX_TAGS_PER_SEARCH

  // Autocomplete tags by prefix, debounced, discarding superseded responses.
  useEffect(() => {
    const trimmed = tagInput.trim()
    if (trimmed.length < 1) {
      setSuggestions([])
      return
    }
    const seq = ++reqSeq.current
    const handle = setTimeout(() => {
      searchTags(trimmed)
        .then((tags) => {
          if (seq === reqSeq.current) setSuggestions(tags)
        })
        .catch(() => {
          if (seq === reqSeq.current) setSuggestions([])
        })
    }, 250)
    return () => clearTimeout(handle)
  }, [tagInput, searchTags])

  const addTag = (name: string) => {
    const clean = name.trim().toLowerCase()
    if (!clean || maxReached || selectedTags.includes(clean)) return
    onTagsChange([...selectedTags, clean])
    setTagInput("")
    setSuggestions([])
    setIsOpen(false)
  }

  const removeTag = (name: string) => {
    onTagsChange(selectedTags.filter((t) => t !== name))
  }

  const visibleSuggestions = suggestions.filter((s) => !selectedTags.includes(s.name))

  return (
    <div className={styles.filters}>
      <Select
        styleType="soft"
        className={styles["category-select"]}
        value={category ?? ""}
        onChange={(e) =>
          onCategoryChange((e.target.value || undefined) as PluginCategory | undefined)
        }
      >
        <option value="">{t("allCategories")}</option>
        {PLUGIN_CATEGORIES.map((c) => (
          <option key={c} value={c}>
            {t(`category.${c}`)}
          </option>
        ))}
      </Select>

      <div className={styles["tag-filter"]}>
        <div className={styles["tag-input-row"]}>
          {selectedTags.map((tag) => (
            <span key={tag} className={styles["tag-chip"]}>
              {tag}
              <button
                type="button"
                className={styles["tag-chip-remove"]}
                onClick={() => removeTag(tag)}
                aria-label={`${t("removeTag")} ${tag}`}
              >
                ×
              </button>
            </span>
          ))}
          {!maxReached && (
            <input
              className={styles["tag-input"]}
              type="text"
              placeholder={selectedTags.length === 0 ? t("tagsPlaceholder") : ""}
              value={tagInput}
              onChange={(e) => {
                setTagInput(e.target.value)
                setIsOpen(true)
              }}
              onFocus={() => setIsOpen(true)}
              onBlur={() => setTimeout(() => setIsOpen(false), 120)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault()
                  addTag(visibleSuggestions[0]?.name ?? tagInput)
                }
              }}
            />
          )}
        </div>

        {isOpen && visibleSuggestions.length > 0 && (
          <ul className={styles["tag-suggestions"]}>
            {visibleSuggestions.map((s) => (
              <li key={s._id}>
                <button
                  type="button"
                  className={styles["tag-suggestion"]}
                  onMouseDown={(e) => {
                    e.preventDefault()
                    addTag(s.name)
                  }}
                >
                  {s.name}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
