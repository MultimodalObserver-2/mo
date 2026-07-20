import { describe, it, expect, vi, beforeEach } from "vitest"

const get = vi.fn().mockResolvedValue({ data: [] })
const post = vi.fn().mockResolvedValue({ data: {} })
const instance = { get, post, defaults: { baseURL: "" } }

// Only the Axios instance is faked. `repositoryUrls` is left real on purpose: the base it
// builds is half of the URL under test. PluginService is stubbed as it reaches `window.core`.
vi.mock("../../src/renderer/src/core/lib/repositoryAxios", () => ({ default: instance }))
vi.mock("../../src/renderer/src/core/services/PluginService", () => ({ default: {} }))

const { default: pluginRepositoryService } = await import(
  "../../src/renderer/src/core/services/PluginRepositoryService"
)

/** The URL Axios would actually request: the configured base plus the call's own path. */
const requestedUrl = (): string => `${instance.defaults.baseURL}${get.mock.calls[0][0]}`

/**
 * `/plugins` and `/tags` are sibling routers under `/api/v1`. Asserting the resolved URL
 * rather than the path argument is deliberate: a base of `/api/v1/plugins` leaves every
 * path argument unchanged and still sends tag requests to a 404.
 */
describe("repository endpoint URLs", () => {
  beforeEach(() => {
    get.mockClear()
    post.mockClear()
    pluginRepositoryService.setHost("localhost:8001")
  })

  it("searches plugins under the /plugins router", async () => {
    await pluginRepositoryService.search({ query: "audio" })
    expect(requestedUrl()).toBe("http://localhost:8001/api/v1/plugins/search")
  })

  it("fetches a plugin detail under the /plugins router", async () => {
    get.mockResolvedValueOnce({ data: {} })
    await pluginRepositoryService.getBySlug("acme", "recorder")
    expect(requestedUrl()).toBe("http://localhost:8001/api/v1/plugins/acme.recorder")
  })

  it("lists tags as a sibling of /plugins, not below it", async () => {
    await pluginRepositoryService.listTags()
    expect(requestedUrl()).toBe("http://localhost:8001/api/v1/tags")
  })

  it("autocompletes tags as a sibling of /plugins, not below it", async () => {
    await pluginRepositoryService.searchTags("au")
    expect(requestedUrl()).toBe("http://localhost:8001/api/v1/tags/search")
  })

  it("checks updates by POSTing the installed plugins under the /plugins router", async () => {
    post.mockResolvedValueOnce({ data: { updates_available: true } })
    const installed = [{ slug: "acme.recorder", version: "1.2.0" }]

    const result = await pluginRepositoryService.checkUpdates(installed)

    expect(result).toBe(true)
    const [path, body] = post.mock.calls[0]
    expect(`${instance.defaults.baseURL}${path}`).toBe(
      "http://localhost:8001/api/v1/plugins/check-updates"
    )
    expect(body).toEqual({ plugins: installed })
  })

  it("skips the request and returns false when nothing is installed", async () => {
    const result = await pluginRepositoryService.checkUpdates([])
    expect(result).toBe(false)
    expect(post).not.toHaveBeenCalled()
  })
})
