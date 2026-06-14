import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const url = (import.meta.env.VITE_SUPABASE_URL ?? "").trim();
const anonKey = (import.meta.env.VITE_SUPABASE_ANON_KEY ?? "").trim();

/** Null when no Supabase project is configured (e.g. local offline demo). */
export const supabase: SupabaseClient | null =
  url && anonKey ? createClient(url, anonKey) : null;

export const hasSupabase = Boolean(supabase);

export const functionsBase = url ? `${url}/functions/v1` : "";
export const supabaseAnonKey = anonKey;
