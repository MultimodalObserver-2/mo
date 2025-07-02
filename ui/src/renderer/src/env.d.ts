/// <reference types="vite/client" />
/// <reference types="@vitest/browser/providers/playwright" />

interface ImportMetaEnv {
  readonly VITE_DEV_API_PORT: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
