import { describe, it, expect } from "vitest"
import {
  isNewerRelease,
  parseSlug,
  pluginKey
} from "../../src/renderer/src/core/pages/plugins/repository/repositoryHelpers"
import { RepositoryRelease } from "../../src/renderer/src/core/types/RepositoryPlugin"

/** Minimal valid release; `isNewerRelease` only reads `name`. */
const rel = (name: string): RepositoryRelease => ({
  name,
  repository_id: "r",
  release_github_id: 1,
  assets: []
})

describe("isNewerRelease", () => {
  it("is true when the release is a higher semver than the installed version", () => {
    expect(isNewerRelease(rel("1.2.0"), "1.1.0")).toBe(true)
    // Numeric, not lexicographic.
    expect(isNewerRelease(rel("1.10.0"), "1.9.0")).toBe(true)
  })

  it("is false when the release equals the installed version", () => {
    expect(isNewerRelease(rel("1.2.0"), "1.2.0")).toBe(false)
  })

  it("is false when the release is older than the installed version", () => {
    expect(isNewerRelease(rel("1.1.0"), "1.2.0")).toBe(false)
  })

  it("is false when there is no release", () => {
    expect(isNewerRelease(null, "1.0.0")).toBe(false)
    expect(isNewerRelease(undefined, "1.0.0")).toBe(false)
  })
})

describe("pluginKey", () => {
  it("joins publisher and plugin slugs with a dot", () => {
    expect(pluginKey({ publisher_slug: "interaction-lab", slug: "keyboard-capture" })).toBe(
      "interaction-lab.keyboard-capture"
    )
  })
})

describe("parseSlug", () => {
  it("splits a route slug on the first dot", () => {
    expect(parseSlug("interaction-lab.keyboard-capture")).toEqual({
      publisherSlug: "interaction-lab",
      pluginSlug: "keyboard-capture"
    })
  })

  it("round-trips with pluginKey", () => {
    const parts = { publisher_slug: "acme", slug: "recorder" }
    expect(parseSlug(pluginKey(parts))).toEqual({
      publisherSlug: "acme",
      pluginSlug: "recorder"
    })
  })
})
