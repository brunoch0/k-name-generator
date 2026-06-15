// K-Name — generate-name edge function
//
// The 성명학 (Korean onomancy) engine composes the name deterministically and
// authentically (사주 보충 · 소리오행 상생 · 수리 · 음양). Anthropic — when a key
// is present — only *enriches the bilingual narrative*; it can never break the
// naming rules. Falls back to the engine's own narrative if the API is absent
// or fails, so the endpoint never leaves a user without a result.

import { createClient } from "npm:@supabase/supabase-js@2";
import { generateNameLocal } from "../_shared/nameGenerator.ts";
import type { NameResult, Profile, Locale } from "../_shared/types.ts";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS, "Content-Type": "application/json" },
  });

const ANTHROPIC_MODEL = "claude-sonnet-4-6";
const ANTHROPIC_URL = "https://api.anthropic.com/v1/messages";

const NARRATIVE_SYSTEM =
  "You are a poetic, classy bilingual copywriter for a Korean-name app aimed at Arabic speakers. You are GIVEN a finished, authentic 2-syllable Korean GIVEN name (이름) and its 성명학 (Korean onomancy) analysis. The person keeps their own family name, so NEVER invent or mention a Korean surname. You MUST NOT change the name, syllables, or analysis. Write warm, evocative copy explaining why this name fits the person — weaving in the syllable meanings and the 오행 element the name supplies to balance their 사주. Prefer the syllables whose meanings overlap most with the user's answers, and CITE that overlap explicitly in narrative_en and narrative_ar so it feels personally made for them (e.g. \"because you chose freedom, we gave you 宇 — the cosmos\"). Keep each narrative to 1–2 lines. Return ONLY valid JSON, no markdown, exactly:\n" +
  `{ "narrative_en": "", "narrative_ar": "", "hidden_en": "", "hidden_ar": "" }` +
  "\nnarrative_* = why this name is them, citing their answers. hidden_* = one extra poetic line about the combined meaning. Fill BOTH English and Arabic naturally (not literal translations).";

function stripFences(text: string): string {
  let t = text.trim().replace(/^```(?:json)?/i, "").replace(/```$/i, "").trim();
  const a = t.indexOf("{");
  const b = t.lastIndexOf("}");
  if (a >= 0 && b > a) t = t.slice(a, b + 1);
  return t;
}

interface Narr {
  narrative_en: string;
  narrative_ar: string;
  hidden_en?: string;
  hidden_ar?: string;
}

function validNarr(x: unknown): x is Narr {
  const n = x as Narr;
  return Boolean(n && n.narrative_en && n.narrative_ar);
}

async function enrichNarrative(
  apiKey: string,
  profile: Profile,
  result: NameResult,
): Promise<Narr | null> {
  const payload = {
    fullName: result.fullName,
    syllables: result.syllables,
    analysis: result.analysis,
    profile: {
      traits: profile.traits,
      value: profile.value,
      aspiration: profile.aspiration,
      vibe: profile.vibe,
      soundLike: profile.soundLike,
      country: profile.country,
      words3: profile.words3,
      favKorean: profile.favKorean,
      unique: profile.unique,
      kFav: profile.kFav,
      oneWord: profile.oneWord,
    },
  };
  const user = `NAME_AND_ANALYSIS = ${JSON.stringify(payload)}`;

  const call = async (strict: boolean): Promise<string | null> => {
    const res = await fetch(ANTHROPIC_URL, {
      method: "POST",
      headers: {
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model: ANTHROPIC_MODEL,
        max_tokens: 1000,
        system: strict ? NARRATIVE_SYSTEM + "\nReturn ONLY the JSON object." : NARRATIVE_SYSTEM,
        messages: [{ role: "user", content: user }],
      }),
    });
    if (!res.ok) {
      console.error("anthropic http", res.status, await res.text());
      return null;
    }
    const data = await res.json();
    return data?.content?.[0]?.text ?? null;
  };

  for (let attempt = 0; attempt < 2; attempt++) {
    const text = await call(attempt === 1);
    if (!text) continue;
    try {
      const parsed = JSON.parse(stripFences(text));
      if (validNarr(parsed)) return parsed;
    } catch (e) {
      console.error("narrative parse", attempt, e);
    }
  }
  return null;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  if (req.method !== "POST") return json({ error: "method not allowed" }, 405);

  let body: { profile?: Profile; locale?: Locale; variation?: number };
  try {
    body = await req.json();
  } catch {
    return json({ error: "invalid json" }, 400);
  }

  const profile = body.profile;
  if (!profile || !profile.traits) return json({ error: "missing profile" }, 400);
  const locale: Locale = body.locale === "ar" ? "ar" : "en";
  const variation = Math.max(0, Math.floor(body.variation ?? 0));

  // 1) authentic name + 성명학 analysis (deterministic)
  const result = generateNameLocal(profile, { variation });

  // 2) optional poetic enrichment (key stays server-side)
  const apiKey = (Deno.env.get("ANTHROPIC_API_KEY") ?? "").trim();
  if (apiKey) {
    try {
      const narr = await enrichNarrative(apiKey, profile, result);
      if (narr) {
        result.narrative_en = narr.narrative_en;
        result.narrative_ar = narr.narrative_ar;
        if (narr.hidden_en) result.hidden_en = narr.hidden_en;
        if (narr.hidden_ar) result.hidden_ar = narr.hidden_ar;
        result.source = "anthropic+engine";
      }
    } catch (e) {
      console.error("enrich error", e);
    }
  }

  // 3) best-effort logging (service role bypasses RLS)
  try {
    const url = (Deno.env.get("SUPABASE_URL") ?? "").trim();
    const serviceKey = (Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "").trim();
    if (url && serviceKey) {
      const admin = createClient(url, serviceKey);
      const { data } = await admin
        .from("generations")
        .insert({ inputs: profile, result, locale })
        .select("id")
        .limit(1);
      if (data?.[0]?.id) result.generation_id = data[0].id as string;
    }
  } catch (e) {
    console.error("log generation failed", e);
  }

  return json(result);
});
