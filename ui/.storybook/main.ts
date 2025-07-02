import type { StorybookConfig } from "@storybook/react-vite"
import path from "path"
import { mergeConfig } from "vite"

const config: StorybookConfig = {
  stories: ["../src/renderer/**/*.mdx", "../src/renderer/**/*.stories.@(js|jsx|mjs|ts|tsx)"],
  addons: [
    "@chromatic-com/storybook",
    "@storybook/addon-docs",
    "@storybook/addon-a11y",
    "@storybook/addon-vitest"
  ],
  framework: {
    name: "@storybook/react-vite",
    options: {}
  },
  viteFinal: async (config) => {
    // Ensure the correct path to the shared directory
    return mergeConfig(config, {
      resolve: {
        alias: {
          "@renderer": path.resolve(__dirname, "../src/renderer/src")
        }
      }
    })
  }
}
export default config
