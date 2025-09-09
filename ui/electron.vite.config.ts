import { resolve } from "path"
import { defineConfig, externalizeDepsPlugin } from "electron-vite"
import injectImportMap from "./vite-plugins/inject-import-map"
import react from "@vitejs/plugin-react"

export default defineConfig({
  main: {
    plugins: [externalizeDepsPlugin()]
  },
  preload: {
    plugins: [externalizeDepsPlugin()]
  },
  renderer: {
    resolve: {
      alias: {
        "@renderer": resolve("src/renderer/src"),
        mo: resolve("src/renderer/shared")
      }
    },
    server: {
      watch: {
        ignored: ["**/src/renderer/src/plugins-dev/**"]
      }
    },
    plugins: [
      react(),
      injectImportMap([
        { importMapKey: "react", chunkName: "react", generateWrapper: true },
        { importMapKey: "mo-sdk", chunkName: "shared", generateWrapper: true }
      ])
    ],
    build: {
      rollupOptions: {
        output: {
          manualChunks: (id) => {
            if (
              id.includes("/node_modules/react/") ||
              id.includes("/node_modules/react-dom/") ||
              id.includes("/node_modules/scheduler/")
            ) {
              return "react"
            }

            if (id.includes("/src/renderer/shared/")) {
              return "shared"
            }

            return
          }
        }
      }
    }
  }
})
