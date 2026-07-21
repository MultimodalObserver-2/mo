import { useEffect, useState } from "react"
import pluginRepositoryService from "@renderer/core/services/PluginRepositoryService"
import { RepositoryPluginDetail } from "@renderer/core/types/RepositoryPlugin"
import { parseSlug } from "./repositoryHelpers"

type DetailTab = "description" | "releases"

/**
 * Loads the detail of the plugin at `selectedSlug` and, once it arrives, replaces its capped
 * `releases` with the full history from the dedicated endpoint. Resets to the description tab
 * on each selection; a `null` slug clears the detail.
 */
export default function usePluginDetail(selectedSlug: string | null) {
  const [detail, setDetail] = useState<RepositoryPluginDetail | null>(null)
  const [isLoadingDetail, setIsLoadingDetail] = useState(false)
  const [isLoadingReleases, setIsLoadingReleases] = useState(false)
  const [activeTab, setActiveTab] = useState<DetailTab>("description")

  useEffect(() => {
    if (!selectedSlug) {
      setDetail(null)
      return
    }
    const { publisherSlug, pluginSlug } = parseSlug(selectedSlug)

    // Guards against a slower response landing after the user selected another plugin.
    let cancelled = false
    setDetail(null)
    setActiveTab("description")
    setIsLoadingDetail(true)
    setIsLoadingReleases(true)

    pluginRepositoryService
      .getBySlug(publisherSlug, pluginSlug)
      .then((d) => {
        if (cancelled) return
        setDetail(d)
        // The detail's own `releases` is capped; replace it with the full history from the
        // dedicated `/releases` endpoint. Everything downstream (release list, latest-release
        // and install/update logic) then reads the complete set from `detail.releases`.
        pluginRepositoryService
          .getReleases(d._id)
          .then((releases) => {
            if (!cancelled) setDetail((prev) => (prev ? { ...prev, releases } : prev))
          })
          .catch(() => {
            // Keep the detail's capped releases if the full fetch fails.
          })
          .finally(() => {
            if (!cancelled) setIsLoadingReleases(false)
          })
      })
      .catch(() => {
        if (!cancelled) {
          setDetail(null)
          setIsLoadingReleases(false)
        }
      })
      .finally(() => {
        if (!cancelled) setIsLoadingDetail(false)
      })

    return () => {
      cancelled = true
    }
  }, [selectedSlug])

  return { detail, isLoadingDetail, isLoadingReleases, activeTab, setActiveTab }
}
