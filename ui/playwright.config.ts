import { defineConfig } from "@playwright/test"

/**
 * See https://playwright.dev/docs/test-configuration.
 */
export default defineConfig({
  testDir: "./tests",

  /* Reporter to use. See https://playwright.dev/docs/test-reporters */
  reporter: "html",

  use: {
    headless: false
  },

  projects: [
    {
      name: "performance",
      testDir: "./tests/performance"
    }
  ]
})
