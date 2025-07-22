import fs from "fs"
import path from "path"

const COLORS = {
  reset: "\x1b[0m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  cyan: "\x1b[36m",
  bold: "\x1b[1m"
}

const LOG_PREFIX = `${COLORS.cyan}[PREMOP]${COLORS.reset}`

function log(msg, color = COLORS.reset) {
  console.log(`${LOG_PREFIX} ${color}${msg}${COLORS.reset}`)
}

function warn(msg) {
  log(msg, COLORS.yellow)
}

function success(msg) {
  log(msg, COLORS.green)
}

// Plugin source and output paths
const pluginsDir = path.join(process.cwd(), "resources", "plugins")
const nsisIncludeDir = path.join(process.cwd(), "build")
const nsisIncludeFile = path.join(nsisIncludeDir, "plugins.nsh")

const skipPlugins = process.argv.includes("--skip-plugins")

if (skipPlugins) {
  warn("Skipping plugin UI generation.")
  fs.writeFileSync(nsisIncludeFile, "; Plugin UI skipped\n!define PLUGINS_COUNT 0\n")
  process.exit(0)
}

if (!fs.existsSync(pluginsDir)) {
  warn("No plugins directory found. Skipping NSIS script generation.")
  if (!fs.existsSync(nsisIncludeDir)) fs.mkdirSync(nsisIncludeDir, { recursive: true })
  fs.writeFileSync(nsisIncludeFile, "; No plugins found\n!define PLUGINS_COUNT 0\n")
  process.exit(0)
}

const pluginFolders = fs.readdirSync(pluginsDir)
const plugins = []

for (const folder of pluginFolders) {
  const metadataPath = path.join(pluginsDir, folder, "metadata.json")
  if (fs.existsSync(metadataPath)) {
    const metadata = JSON.parse(fs.readFileSync(metadataPath, "utf-8"))
    plugins.push({
      id: metadata.id,
      name: metadata.name.replace(/"/g, '""'),
      target: metadata.target,
      folder: folder
    })
  }
}

if (!fs.existsSync(nsisIncludeDir)) {
  fs.mkdirSync(nsisIncludeDir, { recursive: true })
}

let nsisScriptContent = `!define PLUGINS_COUNT ${plugins.length}\n`
nsisScriptContent += '!define PLUGINS_SRC "$INSTDIR\\resources\\plugins"\n\n'

// Define variables
plugins.forEach((plugin, index) => {
  nsisScriptContent += `Var PLUGIN_${index}\n`
  nsisScriptContent += `Var PLUGIN_${index}_STATE\n`
})

// Create checkboxes
nsisScriptContent += `\n!macro CREATE_PLUGIN_CHECKBOXES\n`
plugins.forEach((plugin, index) => {
  nsisScriptContent += `  \${NSD_CreateCheckBox} 0u ${10 + index * 15}u 100% 10u "${plugin.name}"\n`
  nsisScriptContent += `  Pop $PLUGIN_${index}\n`
  nsisScriptContent += `  \${If} $PLUGIN_${index}_STATE == \${BST_CHECKED} \n`
  nsisScriptContent += `    \${NSD_Check} $PLUGIN_${index}\n`
  nsisScriptContent += `  \${EndIf}\n`
})
nsisScriptContent += `!macroend\n\n`

// Read checkbox states
nsisScriptContent += `!macro GET_CHECKBOX_STATES\n`
plugins.forEach((_, index) => {
  nsisScriptContent += `  \${NSD_GetState} $PLUGIN_${index} $PLUGIN_${index}_STATE\n`
})
nsisScriptContent += `!macroend\n\n`

// Perform installation
nsisScriptContent += `!macro PERFORM_PLUGIN_INSTALL\n`
plugins.forEach((plugin, index) => {
  nsisScriptContent += `  \${If} $PLUGIN_${index}_STATE == \${BST_CHECKED}\n`
  nsisScriptContent += `    CreateDirectory "$UserLocalAppData\\multimodal-observer\\plugins\\${plugin.target}"\n`
  nsisScriptContent += `    CopyFiles /SILENT "$INSTDIR\\resources\\plugins\\${plugin.folder}\\*.*" "$UserLocalAppData\\multimodal-observer\\plugins\\${plugin.target}\\${plugin.folder}\\"\n`
  nsisScriptContent += "  ${EndIf}\n"
})
nsisScriptContent += `!macroend\n`

fs.writeFileSync(nsisIncludeFile, nsisScriptContent)
success(`Generated NSIS plugin definitions at ${nsisIncludeFile}`)
