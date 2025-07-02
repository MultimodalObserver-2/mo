import JSZip from "jszip"
import { PluginMetadata } from "../types/PluginMetadata"

/**
 * Extracts and parses the plugin metadata from a ZIP file.
 *
 * This function loads the provided ZIP file, searches for a `metadata.json` file inside,
 * and returns its contents as a PluginMetadata object.
 *
 * @param file - The ZIP file containing the plugin package.
 * @returns A promise that resolves to the parsed PluginMetadata object.
 * @throws Error if the ZIP file does not contain a `metadata.json` file or if parsing fails.
 */
export async function extractMetadataFromZip(file: File): Promise<PluginMetadata> {
  const zip = await JSZip.loadAsync(file)
  const metadataFile = zip.file("metadata.json")
  if (!metadataFile) throw new Error("The plugin zip file does not contain a metadata.json file")

  const content = await metadataFile.async("string")
  const metadata = JSON.parse(content)

  return metadata as PluginMetadata
}
