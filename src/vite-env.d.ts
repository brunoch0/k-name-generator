/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL?: string;
  readonly VITE_SUPABASE_ANON_KEY?: string;
  readonly VITE_GENERATE_FUNCTION?: string;
  readonly VITE_USE_LOCAL_GENERATOR?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
