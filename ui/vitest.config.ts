import path from "node:path"
import { fileURLToPath } from "node:url"

import { defineConfig, mergeConfig } from "vitest/config"

import { storybookTest } from "@storybook/addon-vitest/vitest-plugin"
import electronViteConfig from "./electron.vite.config.js"

const dirname =
  typeof __dirname !== "undefined" ? __dirname : path.dirname(fileURLToPath(import.meta.url))

// More info at: https://storybook.js.org/docs/next/writing-tests/integrations/vitest-addon
export default mergeConfig(
  electronViteConfig,
  defineConfig({
    test: {
      coverage: {
        provider: "v8",
        include: ["src/renderer/src/**/*.ts", "src/renderer/src/**/*.tsx"],
        exclude: [
          "**/types/**",
          "**/pages/**",
          "**/layouts/**",
          "**/store/**",
          "**/plugins-dev/**",
          "**/registrations/**",
          "src/renderer/src/main.tsx",
          "src/renderer/src/app.tsx",
          "src/**/*.d.ts",
          "**/icons/**",
          "**/utils/**",
          "**/lib/**",
          "**/services/**",
          "**/routes.tsx",
          "**/routes.ts"
        ],
        reporter: ["text", "json", "html"],
        enabled: true,
        reportsDirectory: path.join(dirname, "coverage"),
        reportOnFailure: true
      },
      projects: [
        {
          extends: true,
          plugins: [
            // The plugin will run tests for the stories defined in your Storybook config
            // See options at: https://storybook.js.org/docs/next/writing-tests/integrations/vitest-addon#storybooktest
            storybookTest({ configDir: path.join(dirname, ".storybook") })
          ],
          test: {
            name: "storybook",
            browser: {
              enabled: true,
              headless: true,
              provider: "playwright",
              instances: [{ browser: "chromium" }]
            },
            setupFiles: [".storybook/vitest.setup.ts"]
          }
        },
        {
          test: {
            name: "unit",
            globals: true,
            include: ["./tests/unit/**/*.test.ts", "./tests/unit/**/*.test.tsx"]
          }
        }
      ]
    }
  })
)
