import type { Profile, NameResult, Locale } from "./types";
import { generateNameLocal } from "./nameGenerator";
import {
  supabase,
  functionsBase,
  supabaseAnonKey,
  hasSupabase,
} from "./supabase";

const FUNCTION_NAME = (import.meta.env.VITE_GENERATE_FUNCTION ?? "generate-name").trim();
const FORCE_LOCAL = (import.meta.env.VITE_USE_LOCAL_GENERATOR ?? "").trim() === "true";

export interface GenerateArgs {
  profile: Profile;
  locale: Locale;
  variation?: number;
}

/**
 * Generate a Korean name.
 *
 * Order of preference:
 *   1. Supabase edge function (which calls Anthropic, key stays server-side).
 *   2. Deterministic on-device generator (resilient fallback / offline demo).
 */
export async function generateName(args: GenerateArgs): Promise<NameResult> {
  const { profile, locale, variation = 0 } = args;

  if (!FORCE_LOCAL && hasSupabase) {
    try {
      const res = await fetch(`${functionsBase}/${FUNCTION_NAME}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${supabaseAnonKey}`,
          apikey: supabaseAnonKey,
        },
        body: JSON.stringify({ profile, locale, variation }),
      });
      if (res.ok) {
        const data = (await res.json()) as NameResult;
        if (data?.fullName?.hangul) return data;
      }
    } catch {
      // fall through to local generator
    }
  }

  // Local fallback — never leaves the user without a name.
  const local = generateNameLocal(profile, { variation });
  // Best-effort: still log the generation if Supabase is configured, and keep
  // the row id so emails / handcraft requests can link to it.
  if (hasSupabase && supabase) {
    try {
      const { data } = await supabase
        .from("generations")
        .insert({ inputs: profile, result: local, locale })
        .select("id")
        .limit(1);
      if (data?.[0]?.id) local.generation_id = data[0].id as string;
    } catch {
      /* logging is best-effort */
    }
  }
  return local;
}

/** Save a captured email, linked to the generation when known. */
export async function saveEmail(
  email: string,
  generation?: NameResult,
): Promise<boolean> {
  if (!hasSupabase || !supabase) return true; // offline demo
  const { error } = await supabase
    .from("emails")
    .insert({ email, generation_id: generation?.generation_id ?? null });
  // Unique-violation (already subscribed) still counts as success for UX.
  if (error && !`${error.message}`.toLowerCase().includes("duplicate")) {
    return false;
  }
  return true;
}

/** Save a hand-brushed (human-touch) request. */
export async function saveHandcraftRequest(
  email: string,
  generationId?: string,
  shared = false,
): Promise<boolean> {
  if (!hasSupabase || !supabase) return true; // offline demo
  const { error } = await supabase
    .from("handcraft_requests")
    .insert({ email, generation_id: generationId ?? null, shared });
  if (error && !`${error.message}`.toLowerCase().includes("duplicate")) {
    return false;
  }
  return true;
}

/** Mark any handcraft request for this generation as having shared (draw entry). */
export async function markHandcraftShared(generationId?: string): Promise<void> {
  if (!hasSupabase || !supabase || !generationId) return;
  try {
    await supabase
      .from("handcraft_requests")
      .update({ shared: true })
      .eq("generation_id", generationId);
  } catch {
    /* best-effort */
  }
}
