import JSZip from "jszip"
import { PluginMetadata } from "../types/PluginMetadata"

export async function extractMetadataFromZip(file: File): Promise<PluginMetadata> {
  const zip = await JSZip.loadAsync(file)
  const metadataFile = zip.file("metadata.json")
  if (!metadataFile) throw new Error("The plugin zip file does not contain a metadata.json file")

  const content = await metadataFile.async("string")
  const metadata = JSON.parse(content)

  return metadata as PluginMetadata
}
