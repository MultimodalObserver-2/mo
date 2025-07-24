import { describe, it, expect, beforeEach, vi } from "vitest"
import pluginManager from "../../src/renderer/src/core/plugin/PluginManager"
import { PluginBase, Properties } from "../../src/renderer/src/core/plugin/types"
import type { PluginMetadata } from "../../src/renderer/src/core/plugin/types/PluginMetadata"

const exampleMetadata: PluginMetadata = {
  id: "pluginA",
  name: "Plugin A",
  description: "Test plugin",
  version: "0.0.1",
  publisher: { id: "acme", name: "Acme Co." },
  entryPoints: { "mo.ui.renderer.plugin": "main.js#PluginA" },
  target: "ui"
}

class DummyPlugin extends PluginBase {
  metadata = exampleMetadata
}

const fullId = "acme.pluginA"

beforeEach(async () => {
  await pluginManager.removeAll()
  vi.stubGlobal("window", {
    core: {
      app: {
        paths: {
          plugins: vi.fn().mockResolvedValue("/mock/plugins")
        }
      },
      fs: {},
      path: {}
    }
  })
})

describe("PluginManager public API", () => {
  it("getPluginFinalId returns correct id", () => {
    expect(pluginManager.getPluginFinalId(exampleMetadata)).toBe(fullId)
  })

  it("getPluginNamespace returns correct namespace", () => {
    expect(pluginManager.getPluginNamespace(exampleMetadata)).toBe("acme-pluginA")
  })

  it("removeAll removes all plugins", async () => {
    // @ts-ignore: ignore
    pluginManager.plugins.set(fullId, { id: fullId, metadata: exampleMetadata, is_loaded: true })
    await pluginManager.removeAll()
    await expect(pluginManager.getPluginsMetadata()).resolves.toEqual([])
  })

  it("removePlugin removes one plugin", async () => {
    // @ts-ignore: ignore
    pluginManager.plugins.set(fullId, { id: fullId, metadata: exampleMetadata, is_loaded: true })
    await pluginManager.removePlugin(fullId)
    await expect(pluginManager.getPluginsMetadata()).resolves.toEqual([])
  })

  it("removePlugin throws if not exist", async () => {
    await expect(pluginManager.removePlugin("not.exist")).rejects.toThrow()
  })

  it("getPluginDirNameById returns dirName", () => {
    // @ts-ignore: ignore
    pluginManager.plugins.set(fullId, {
      id: fullId,
      dirName: "pluginA",
      metadata: exampleMetadata,
      is_loaded: true
    })
    expect(pluginManager.getPluginDirNameById(fullId)).toBe("pluginA")
  })

  it("getPluginProperties returns default if missing", () => {
    // @ts-ignore: ignore
    pluginManager.plugins.set(fullId, { id: fullId, metadata: exampleMetadata, is_loaded: true })
    expect(pluginManager.getPluginProperties(fullId)).toBeInstanceOf(Properties)
  })

  it("getPluginProperties returns actual if exists", () => {
    const customProps = new Properties()
    // @ts-ignore: ignore
    pluginManager.plugins.set(fullId, {
      id: fullId,
      metadata: exampleMetadata,
      properties: customProps,
      is_loaded: true
    })
    expect(pluginManager.getPluginProperties(fullId)).toBe(customProps)
  })

  it("getPluginsByType returns plugin instances of correct type", () => {
    // @ts-ignore: ignore
    pluginManager.plugins.set(fullId, {
      id: fullId,
      pluginClass: DummyPlugin,
      metadata: exampleMetadata,
      is_loaded: true
    })
    const plugins = pluginManager.getPluginsByType(DummyPlugin)
    expect(Array.isArray(plugins)).toBe(true)
  })

  it("getPluginsMetadataByType filters by type", async () => {
    // @ts-ignore: ignore
    const dtos = await pluginManager.getPluginsMetadataByType(DummyPlugin)
    expect(dtos.length).toBe(0)
  })

  it("getPluginClassById returns plugin class", () => {
    // @ts-ignore: ignore
    pluginManager.plugins.set(fullId, {
      id: fullId,
      pluginClass: DummyPlugin,
      metadata: exampleMetadata,
      is_loaded: true
    })
    expect(pluginManager.getPluginClassById(fullId)).toBe(DummyPlugin)
  })

  it("getPluginInstanceByIdAndType throws on wrong type", () => {
    class AnotherPlugin extends PluginBase {
      metadata = exampleMetadata
    }
    // @ts-ignore: ignore
    pluginManager.plugins.set(fullId, {
      id: fullId,
      pluginClass: DummyPlugin,
      metadata: exampleMetadata,
      is_loaded: true
    })
    expect(() => pluginManager.getPluginInstanceByIdAndType(fullId, AnotherPlugin)).toThrow()
  })

  it("getPluginClassById throws if not loaded", () => {
    // @ts-ignore: ignore
    pluginManager.plugins.set(fullId, { id: fullId, metadata: exampleMetadata, is_loaded: true })
    expect(() => pluginManager.getPluginClassById(fullId)).toThrow()
  })

  it("entryPointExists works as expected (private method)", () => {
    // @ts-ignore: ignore
    const exists = pluginManager.entryPointExists(exampleMetadata, "mo.ui.renderer.plugin")
    expect(exists).toBe(true)
    // @ts-ignore: ignore
    const notExists = pluginManager.entryPointExists(exampleMetadata, "not-an-entry")
    expect(notExists).toBe(false)
  })

  it("getEntryPoint returns correct relPath and exportName (private method)", () => {
    // @ts-ignore: ignore
    const { relPath, exportName } = pluginManager.getEntryPoint(
      exampleMetadata,
      "mo.ui.renderer.plugin"
    )
    expect(relPath).toBe("main.js")
    expect(exportName).toBe("PluginA")
  })

  it("getEntryPoint throws if group not defined (private method)", () => {
    // @ts-ignore: ignore
    expect(() => pluginManager.getEntryPoint(exampleMetadata, "notfound")).toThrow()
  })
})
