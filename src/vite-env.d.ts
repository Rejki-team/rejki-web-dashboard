/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL: string
  readonly VITE_API_TARGET: string
  readonly VITE_MAX_EVIDENCE_BYTES: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

// Deklarasi modul SFC `.vue` untuk TypeScript.
declare module '*.vue' {
  import type { DefineComponent } from 'vue'
  const component: DefineComponent<Record<string, never>, Record<string, never>, unknown>
  export default component
}
