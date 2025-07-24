// For more info, see https://github.com/storybookjs/eslint-plugin-storybook#configuration-flat-config-format
import storybook from "eslint-plugin-storybook"

import i18next from "eslint-plugin-i18next"
import tseslint from "@electron-toolkit/eslint-config-ts"
import eslintConfigPrettier from "@electron-toolkit/eslint-config-prettier"
import eslintPluginReact from "eslint-plugin-react"
import eslintPluginReactHooks from "eslint-plugin-react-hooks"
import eslintPluginReactRefresh from "eslint-plugin-react-refresh"

export default tseslint.config(
  {
    ignores: [
      "**/node_modules",
      "**/dist",
      "**/out",
      "./plugins",
      "**/plugins-dev/**",
      "**/build/**",
      "**/stories/**"
    ]
  },
  tseslint.configs.recommended,
  eslintPluginReact.configs.flat.recommended,
  eslintPluginReact.configs.flat["jsx-runtime"],
  {
    settings: {
      react: {
        version: "detect"
      }
    }
  },
  {
    files: ["**/*.{ts,tsx}"],
    plugins: {
      "react-hooks": eslintPluginReactHooks,
      "react-refresh": eslintPluginReactRefresh
    },
    rules: {
      ...eslintPluginReactHooks.configs.recommended.rules,
      ...eslintPluginReactRefresh.configs.vite.rules,
      "@typescript-eslint/explicit-function-return-type": "off"
    }
  },
  {
    files: ["**/*.stories.@(js|jsx|ts|tsx|mjs|cjs)"],
    plugins: {
      storybook
    },
    rules: {
      ...storybook.configs.recommended.rules
    }
  },
  {
    files: ["**/*.{js,jsx,ts,tsx}"],
    plugins: {
      i18next
    },
    rules: {
      ...i18next.configs.recommended.rules
    }
  },
  eslintConfigPrettier
)
