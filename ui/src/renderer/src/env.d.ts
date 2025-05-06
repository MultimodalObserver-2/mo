/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_DEV_API_PORT: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
