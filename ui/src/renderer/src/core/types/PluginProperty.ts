export const PluginPropertyTypes = {
  INT: "int",
  FLOAT: "float",
  TEXT: "text",
  BOOL: "bool",
  PATH: "path",
  SELECT: "select"
}

export type PluginPropertyType = (typeof PluginPropertyTypes)[keyof typeof PluginPropertyTypes]

export type PropertyDataNumber = {
  min?: number
  max?: number
  step?: number
}

export type PropertyDataText = {
  max_length?: number
  min_length?: number
}

export type PropertyDataPath = {
  file_types?: string[]
}

export type PropertyDataSelect = {
  options: string[]
}

export type PluginProperty = {
  key: string
  label: string
  required: boolean
  visible: boolean
  enabled: boolean
  default?: string | number | boolean
  data: Record<string, unknown>
  property_type: PluginPropertyType
  reactive: boolean
}
