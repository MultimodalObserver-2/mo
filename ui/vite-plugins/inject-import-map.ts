import path from "path"
import fs from "fs"
import { Plugin, ResolvedConfig } from "vite"
import type { OutputBundle, NormalizedOutputOptions } from "rollup"

export type ImportMapEntry = {
  /** Key used in the import map (what consumers will import) */
  importMapKey: string
  /** The chunk name as defined in manualChunks */
  chunkName: string
  /** If true, generate a wrapper file with readable export names */
  generateWrapper?: boolean
  /** Optional custom wrapper file name */
  wrapperFile?: string
}

const COLORS = {
  reset: "\x1b[0m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  cyan: "\x1b[36m",
  bold: "\x1b[1m"
}

const LOG_PREFIX = `${COLORS.cyan}[IMAP]${COLORS.reset}`

/**
 * Vite plugin to automate import map and readable export wrappers for chunks.
 *
 * @param mappings - Array of import map entries, each describing a chunk and its import map key.
 */
export default function injectImportMap(mappings: ImportMapEntry[] = []): Plugin {
  // Maps importMapKey to its resolved public path (chunk or wrapper)
  const finalChunkPaths: Record<string, string> = {}
  // Internal map: importMapKey -> absolute file path (for preloading)
  const resolvedFilePaths: Record<string, string> = {}

  let isBuild = false
  // Default output directory (overridden in configResolved)
  let outDir = "out/renderer/"
  const resolvedBase = "/"

  return {
    name: "vite-plugin-inject-import-map",

    /**
     * Hook: Called after the Vite config is resolved.
     * Used to get the build outDir and detect build mode.
     */
    configResolved(config: ResolvedConfig) {
      isBuild = config.command === "build"
      if (config.build?.outDir) {
        outDir = config.build.outDir
      }
    },

    /**
     * Hook: Called after the bundle is generated (but before files are written to disk).
     * Finds all the target chunks, optionally generates wrappers, and records their paths for the import map.
     */
    async generateBundle(_options: NormalizedOutputOptions, bundle: OutputBundle) {
      if (!isBuild) return
      console.log(
        `\n${LOG_PREFIX} ${COLORS.bold}Scanning generated bundle for import map chunks...${COLORS.reset}`
      )

      for (const mapping of mappings) {
        const { importMapKey, chunkName, generateWrapper, wrapperFile } = mapping
        let found = false

        for (const fileName in bundle) {
          const chunkOrAsset = bundle[fileName]
          if (chunkOrAsset.type === "chunk" && chunkOrAsset.name === chunkName) {
            // Output directory (relative to outDir)
            const outputDir = path.dirname(bundle[fileName].fileName)
            const outPath = path.join(outputDir) // relative to outDir
            let importMapPath: string // path for import map (relative to index.html)

            // Optionally generate a wrapper for readable export names
            if (generateWrapper) {
              const code = chunkOrAsset.code
              const exportMatch = code.match(/export\s*{\s*([^}]+)\s*}/)
              if (!exportMatch) {
                console.warn(
                  `${LOG_PREFIX} ${COLORS.yellow}⚠ Could not find export statement in chunk "${chunkName}".${COLORS.reset}`
                )
                continue
              }

              // Build minified->original mapping
              const exportsMap: Record<string, string> = {}
              exportMatch[1]
                .split(",")
                .map((e) => e.trim())
                .forEach((exp) => {
                  const asMatch = exp.match(/^([\w$]+)\s+as\s+([\w$]+)$/)
                  if (asMatch) {
                    const [, original, mangled] = asMatch
                    exportsMap[mangled] = original
                  } else {
                    exportsMap[exp] = exp
                  }
                })

              const importFile = "./" + path.basename(fileName)
              const imports = Object.entries(exportsMap)
                .map(([min, real]) => (min === real ? real : `${min} as ${real}`))
                .join(", ")
              const exports = Object.values(exportsMap).join(", ")

              const wrapperContent = `
import { ${imports} } from "${importFile}";
export { ${exports} };
`

              // Wrapper file name, by default `${chunkName}-wrapper.js` (allow override)
              const wrapperFileName = wrapperFile || `${chunkName}-wrapper.js`
              const fullWrapperPath = path.join(outDir, outPath, wrapperFileName)
              const mkdirPath = path.join(outDir, outPath)
              fs.mkdirSync(mkdirPath, { recursive: true })

              fs.writeFileSync(fullWrapperPath, wrapperContent)
              console.log(
                `${LOG_PREFIX} ${COLORS.green}✔ Wrapper generated: ${fullWrapperPath}${COLORS.reset}`
              )

              // For the import map, map to the wrapper file path (relative to HTML)
              importMapPath = path.join(resolvedBase, outPath, wrapperFileName).replace(/\\/g, "/")
              resolvedFilePaths[importMapKey] = "." + importMapPath
            } else {
              // No wrapper: point import map to the chunk
              importMapPath = path.join(resolvedBase, chunkOrAsset.fileName).replace(/\\/g, "/")
            }

            finalChunkPaths[importMapKey] = "." + importMapPath

            console.log(
              `${LOG_PREFIX} ${COLORS.green}✔ Found chunk '${chunkName}' for key '${importMapKey}'. Path: ${importMapPath}${COLORS.reset}`
            )
            found = true
            break
          }
        }

        if (!found) {
          console.warn(
            `${LOG_PREFIX} ${COLORS.yellow}⚠ Chunk '${chunkName}' for key '${importMapKey}' not found in the bundle.${COLORS.reset}`
          )
        }
      }
    },

    /**
     * Hook: Called before index.html is written.
     * Injects the import map and <link rel="modulepreload"> tags for the wrappers/chunks.
     */
    transformIndexHtml(html: string) {
      if (!isBuild) return

      if (Object.keys(finalChunkPaths).length === 0) {
        console.warn(
          `${LOG_PREFIX} ${COLORS.yellow}⚠ No chunk paths found. Import map will not be injected.${COLORS.reset}`
        )
        return html
      }

      const importMap = {
        imports: { ...finalChunkPaths }
      }

      // Prepare <link rel="modulepreload"> tags for all wrappers
      const preloadLinks = Object.values(resolvedFilePaths).map((relativeHref) => ({
        tag: "link",
        attrs: {
          rel: "modulepreload",
          crossorigin: "",
          href: relativeHref
        },
        injectTo: "head" as const
      }))

      const importMapTag = `<script type="importmap">${JSON.stringify(importMap)}</script>`

      console.log(
        `${LOG_PREFIX} ${COLORS.bold}Injecting import map into HTML:${COLORS.reset}\n${COLORS.cyan}${importMapTag}${COLORS.reset}`
      )

      return {
        html,
        tags: [
          {
            tag: "script",
            attrs: { type: "importmap" },
            children: JSON.stringify(importMap),
            injectTo: "head-prepend"
          },
          ...preloadLinks
        ]
      }
    }
  }
}
