import { describe, it, expect, vi, beforeEach } from "vitest"

type RepositoryAxiosModule = typeof import("../../src/renderer/src/core/lib/repositoryAxios")

const get = vi.fn().mockResolvedValue({ data: [] })
const instance = { get, defaults: { baseURL: "" } }

// Only the Axios instance is faked: the real `buildBaseUrl` has to run, because the base
// is half of the URL under test. PluginService is stubbed since it reaches `window.core`.
vi.mock("../../src/renderer/src/core/lib/repositoryAxios", async (importOriginal) => ({
  ...(await importOriginal<RepositoryAxiosModule>()),
  default: instance
}))
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
})
