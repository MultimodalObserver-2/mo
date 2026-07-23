import { describe, it, expect } from "vitest"
import {
  buildBaseUrl,
  buildPluginWebUrl,
  normalizeHost
} from "../../src/renderer/src/core/lib/repositoryUrls"

describe("normalizeHost", () => {
  it("keeps a bare host untouched", () => {
    expect(normalizeHost("localhost:8001")).toBe("localhost:8001")
    expect(normalizeHost("mo.informatica.usach.cl")).toBe("mo.informatica.usach.cl")
  })

  it("reduces a full URL to its host", () => {
    expect(normalizeHost("http://localhost:8001/api/v1/plugins")).toBe("localhost:8001")
    expect(normalizeHost("https://mo.informatica.usach.cl/api/v1/plugins")).toBe(
      "mo.informatica.usach.cl"
    )
  })

  it("trims surrounding whitespace and trailing paths", () => {
    expect(normalizeHost("  localhost:8001/  ")).toBe("localhost:8001")
  })

  it("returns an empty string for values it cannot parse", () => {
    expect(normalizeHost("")).toBe("")
    expect(normalizeHost("   ")).toBe("")
    expect(normalizeHost("http://")).toBe("")
  })
})

describe("buildBaseUrl", () => {
  it("uses http for loopback and private networks", () => {
    expect(buildBaseUrl("localhost:8001")).toBe("http://localhost:8001/api/v1")
    expect(buildBaseUrl("127.0.0.1:8001")).toBe("http://127.0.0.1:8001/api/v1")
    expect(buildBaseUrl("192.168.1.40:8001")).toBe("http://192.168.1.40:8001/api/v1")
    expect(buildBaseUrl("10.0.0.5")).toBe("http://10.0.0.5/api/v1")
    expect(buildBaseUrl("172.16.0.9")).toBe("http://172.16.0.9/api/v1")
  })

  it("uses https for public hosts", () => {
    expect(buildBaseUrl("mo.informatica.usach.cl")).toBe("https://mo.informatica.usach.cl/api/v1")
    expect(buildBaseUrl("8.8.8.8:8001")).toBe("https://8.8.8.8:8001/api/v1")
  })

  it("does not mistake public ranges for private ones", () => {
    // 172.32 and 11.x sit just outside the private blocks.
    expect(buildBaseUrl("172.32.0.1")).toBe("https://172.32.0.1/api/v1")
    expect(buildBaseUrl("11.0.0.1")).toBe("https://11.0.0.1/api/v1")
  })

  it("accepts a full URL and rebuilds the scheme from the host", () => {
    // The value stored before the preference became host-only: only the host survives,
    // the old `/api/v1/plugins` path is discarded and rebuilt.
    expect(buildBaseUrl("http://localhost:8001/api/v1/plugins")).toBe(
      "http://localhost:8001/api/v1"
    )
    // The stored scheme does not survive: a public host is always reached over https.
    expect(buildBaseUrl("http://mo.informatica.usach.cl")).toBe(
      "https://mo.informatica.usach.cl/api/v1"
    )
  })

  it("falls back to the default host when the value cannot be parsed", () => {
    expect(buildBaseUrl("")).toBe("http://localhost:8001/api/v1")
    expect(buildBaseUrl("not a host")).toBe("http://localhost:8001/api/v1")
  })
})

describe("buildPluginWebUrl", () => {
  // Tests run in dev mode, so the web host resolves to its dev default.
  it("builds the plugin page on the web platform", () => {
    expect(buildPluginWebUrl("interaction-lab", "keyboard-capture")).toBe(
      "http://localhost:3000/plugins/interaction-lab.keyboard-capture"
    )
  })

  it("escapes slugs so they cannot alter the path", () => {
    expect(buildPluginWebUrl("acme", "../admin")).toBe(
      "http://localhost:3000/plugins/acme...%2Fadmin"
    )
  })
})
