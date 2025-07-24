import { describe, it, expect } from "vitest"
import {
  Properties,
  Property,
  PropertyType,
  VALIDATORS
} from "../../src/renderer/src/core/plugin/types/Properties"
import { PluginBase } from "../../src/renderer/src/core/plugin/types/PluginBase"
import { PluginMetadata } from "../../src/renderer/src/core/plugin/types/PluginMetadata"

describe("Properties class", () => {
  it("can add and retrieve a number property", () => {
    const props = new Properties()
    props.addNumber("num", "A number", 0, 100, 1)
    const prop = props.getProperty("num")
    expect(prop).toBeInstanceOf(Property)
    expect(prop?.getType()).toBe(PropertyType.NUMBER)
    expect(prop?.data.min).toBe(0)
    expect(prop?.data.max).toBe(100)
    expect(prop?.data.step).toBe(1)
  })

  it("can add and retrieve a text property", () => {
    const props = new Properties()
    props.addText("txt", "A text", 2, 8)
    const prop = props.getProperty("txt")
    expect(prop).toBeInstanceOf(Property)
    expect(prop?.getType()).toBe(PropertyType.TEXT)
    expect(prop?.data.minLength).toBe(2)
    expect(prop?.data.maxLength).toBe(8)
  })

  it("can add a bool property with default value false", () => {
    const props = new Properties()
    props.addBool("flag", "A flag")
    const prop = props.getProperty("flag")
    expect(prop).toBeInstanceOf(Property)
    expect(prop?.getType()).toBe(PropertyType.BOOL)
    expect(prop?.default).toBe(false)
  })

  it("can add select property and validate select options", () => {
    const props = new Properties()
    props.addSelect("color", "Color", [
      { label: "Red", value: "red" },
      { label: "Blue", value: "blue" }
    ])
    const prop = props.getProperty("color")
    expect(prop?.getType()).toBe(PropertyType.SELECT)
    props.updateSelectOptions("color", [{ label: "Green", value: "green" }])
    expect((prop?.data as { options: { label: string; value: string }[] }).options[0].value).toBe("green")
  })

  it("throws if property already exists", () => {
    const props = new Properties()
    props.addNumber("num", "A number")
    expect(() => props.addNumber("num", "Other number")).toThrow()
  })

  it("removes a property", () => {
    const props = new Properties()
    props.addText("txt", "A text")
    props.removeProperty("txt")
    expect(props.getProperty("txt")).toBeUndefined()
  })

  it("sets required/visible/enabled flags", () => {
    const props = new Properties()
    props.addText("txt", "A text")
    props.setRequired("txt", false)
    props.setVisible("txt", false)
    props.setEnabled("txt", false)
    const prop = props.getProperty("txt")
    expect(prop?.required).toBe(false)
    expect(prop?.visible).toBe(false)
    expect(prop?.enabled).toBe(false)
  })

  it("gets default values only for properties with defaults", () => {
    const props = new Properties()
    props.addNumber("num", "A number")
    props.setDefault("num", 7)
    props.addBool("flag", "A flag") // default false by addBool
    expect(props.getDefaultValues()).toEqual({ num: 7, flag: false })
  })

  it("validates settings according to property types", () => {
    const props = new Properties()
    props.addNumber("num", "A number")
    props.addBool("flag", "A flag")
    props.addSelect("color", "Color", [{ label: "Red", value: "red" }])
    const settings = { num: 42, flag: true, color: "red" }
    expect(props.validate(settings)).toBe(true)
  })

  it("throws error if validation fails", () => {
    const props = new Properties()
    props.addNumber("num", "A number")
    expect(() => props.validate({})).toThrow()
    props.addSelect("color", "Color", [{ label: "Red", value: "red" }])
    expect(() => props.validate({ num: 2, color: "blue" })).toThrow()
  })
})

describe("Property class", () => {
  it("clones itself including data and callback", () => {
    const prop = new Property("x", "X", PropertyType.NUMBER, { min: 1 })
    prop.setModifiedCallback(() => ({}))
    const clone = prop.clone()
    expect(clone).not.toBe(prop)
    expect(clone.key).toBe("x")
    expect(clone.data.min).toBe(1)
    expect(typeof clone.getModifiedCallback()).toBe("function")
  })

  it("toObject returns correct shape", () => {
    const prop = new Property("y", "Y", PropertyType.TEXT)
    prop.default = "abc"
    const obj = prop.toObject()
    expect(obj.key).toBe("y")
    expect(obj.label).toBe("Y")
    expect(obj.property_type).toBe(PropertyType.TEXT)
    expect(obj.default).toBe("abc")
    expect(obj.reactive).toBe(false)
  })
})

describe("VALIDATORS", () => {
  it("validates number", () => {
    expect(VALIDATORS[PropertyType.NUMBER](3)).toBe(true)
    expect(VALIDATORS[PropertyType.NUMBER]("x")).toBe(false)
  })
  it("validates text", () => {
    expect(VALIDATORS[PropertyType.TEXT]("a")).toBe(true)
    expect(VALIDATORS[PropertyType.BOOL]("a")).toBe(false)
  })
  it("validates bool", () => {
    expect(VALIDATORS[PropertyType.BOOL](true)).toBe(true)
    expect(VALIDATORS[PropertyType.TEXT](true)).toBe(false)
  })
  it("validates select", () => {
    expect(VALIDATORS[PropertyType.SELECT]("x", [{ label: "A", value: "x" }])).toBe(true)
    expect(VALIDATORS[PropertyType.SELECT]("y", [{ label: "A", value: "x" }])).toBe(false)
  })
})

describe("PluginBase contract", () => {
  it("calls onConfigure when configure is used", () => {
    class MyPlugin extends PluginBase {
      metadata = {
        id: "plug",
        name: "Plug",
        description: "",
        version: "1.0.0",
        publisher: { id: "me", name: "Me" },
        entryPoints: {},
        target: "ui"
      } as PluginMetadata
      lastConfig: Record<string, unknown>
      onConfigure(settings) {
        this.lastConfig = settings
      }
    }
    const plugin = new MyPlugin()
    plugin.configure({ foo: "bar" })
    expect(plugin.settings).toEqual({ foo: "bar" })
    expect(plugin.lastConfig).toEqual({ foo: "bar" })
  })
})
