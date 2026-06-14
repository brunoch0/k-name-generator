# K-Name 🇰🇷✨

A viral **Korean-name generator for Arabic speakers**. Answer a short, tap-based
quiz and receive an authentic, meaningful Korean name on a beautiful,
downloadable, shareable card. English UI by default with a full **Arabic + RTL**
toggle.

Built for virality and email capture — **free**, no monetization.

---

## ✨ What it does

1. A 13-step animated quiz collects rich personal signals (name, feel,
   sound-like-your-real-name, birth date → 사주/오행, traits, values, aspiration,
   vibe (8 validated emoji choices), element, + optional 3-words / favourite
   Korean words / unique trait / opt-in social handle).
2. **The Ritual** — a calm ~4s ceremony ("Reading your essence…" → "Choosing
   characters that carry your meaning…" → "Brushing your name…") on an ink/paper
   stage, so the result feels hand-crafted, never machine-instant.
3. A name is composed by the **성명학 engine** from real Korean naming syllables —
   surname (성) + a 2-syllable given name (이름).
4. **Brush calligraphy reveal** — the Hangul name is painted on with a masked
   left-to-right brush wipe + ink-bleed (Nanum Brush Script), then romanization,
   hanja meanings, narrative and 작명 풀이 fade in.
5. The result is an instagrammable card with hanja meanings, a poetic narrative,
   the 작명 풀이 (사주 보충 · 소리오행 · 수리), and a pronunciation guide. Opt-in:
   render "@handle's Korean name" on the card.
6. The user can **download PNGs** (1:1 + 9:16), **share to unlock a hidden
   meaning**, **generate another** (a different-reading name from the same
   answers), leave an **email**, or request the **hand-brushed human tier**.

---

## 🏗 Architecture

```
React + Vite + TS + Tailwind  ──fetch──▶  Supabase Edge Function (Deno)
        (browser, anon key)                 │
                                            │  ① 성명학 engine composes the name
                                            │     (deterministic, authentic)
                                            │  ② Anthropic enriches the narrative
                                            ▼     (ANTHROPIC_API_KEY — secret)
                                     Anthropic Messages API (claude-sonnet-4-6)
                                            │
                                            ▼
                                     Supabase Postgres (generations, emails)
```

- **The 성명학 engine is authoritative for the name.** Anthropic only writes the
  poetic bilingual narrative — it can never break the naming rules. If no key is
  set (or the call fails), the engine's own narrative is used.
- **The Anthropic key lives ONLY as a Supabase Edge Function secret.** It never
  appears in client code, the bundle, or any committed env file.
- The same engine runs on-device as a fallback, so the app never leaves a user
  without a name and can be demoed fully offline.

> Security checklist baked in: `verify_jwt = false` for the public function,
> `supabase-js .from()` (not `.table()`), `.limit(1)` instead of `.single()`,
> `.trim()` on every env read, `.env` git-ignored, RLS insert-only for anon.

---

## 🚀 Run locally

```bash
npm install
cp .env.example .env      # fill in values (or leave blank for offline demo)
npm run dev               # http://localhost:5173
```

**Offline demo (no Supabase / no API key):** leave `.env` blank — the app uses
the on-device generator automatically, so the entire flow is verifiable end to
end. To force it explicitly: `VITE_USE_LOCAL_GENERATOR=true`.

Type-check + production build:

```bash
npm run build
```

---

## ☁️ Deploy

### 1. Supabase (database + function)

```bash
npm i -g supabase
supabase login
supabase link --project-ref <your-project-ref>

# DB schema (generations, emails, handcraft_requests)
supabase db push                       # applies supabase/migrations/*.sql

# Secret — the Anthropic key (server-side only!)
supabase secrets set ANTHROPIC_API_KEY=sk-ant-xxxxx

# Function
supabase functions deploy generate-name
```

`SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are injected into the function
automatically by Supabase — no need to set them.

### 2. Vercel (frontend)

```bash
npm i -g vercel
vercel            # link / first deploy (preview)
vercel --prod     # production
```

Set these **environment variables** in the Vercel project (Settings → Env):

| Variable | Value |
| --- | --- |
| `VITE_SUPABASE_URL` | `https://<ref>.supabase.co` |
| `VITE_SUPABASE_ANON_KEY` | your anon / publishable key |
| `VITE_GENERATE_FUNCTION` | `generate-name` (default) |

> Only the **anon** key is ever exposed to the browser — that's by design.

---

## 🧬 The naming data

`src/data/syllablePool.ts` holds the curated, authentic naming data — ~48 real
given-name syllables (with hangul, hanja, EN/AR meanings, and matching tags) and
12 common surnames. The edge function keeps a synced Deno copy under
`supabase/functions/_shared/`. **Don't regenerate the pool** — edit both copies
together if you ever change it.

### 성명학 (Korean onomancy) engine

The name isn't just phonetic matching — it follows the layers a real Korean
작명소 (naming house) uses (`src/lib/myeonghak.ts`):

- **② 사주 보충 (primary)** — a lightweight birth-chart read (연주 + 계절) tallies
  the five elements and finds the one the chart **lacks (용신)**. The name is
  built to supply it, via 자원오행 (the hanja's element) and/or 발음오행 (the
  initial-sound element). User-picked element is a secondary tiebreak.
- **① 소리오행 (발음오행)** — each syllable's initial consonant maps to an element;
  the 성→이름1→이름2 sequence is optimised to form a **상생 (generating)** flow and
  avoid **상극 (clashing)**. Computed straight from hangul, so it's exact.
- **③ 수리 81수리** — 강희자전 stroke counts build the 5 grids (천·인·지·외·총격),
  scored against the 81-수리 auspicious-number table.
- **④ 음양** — odd/even (陽/陰) stroke balance.
- Plus **personality** (traits/value/vibe/aspiration) and an optional name-sound
  echo, with gender filtering and a naturalness/awkward-word guard.

The chosen name ships with a full `analysis` (사주 보충 · 소리오행 흐름 · 수리 · 음양)
that the result card surfaces as a "Your name reading". "Generate another" walks
the ranked list of distinct valid names.

> Stroke counts (강희자전 원획) are bounded data and tunable; 소리오행 carries the
> main authenticity since it's derived exactly from hangul. This is
> entertainment-grade 성명학 (no birth-hour / 만세력), not a licensed reading.

---

## 📁 Structure

```
src/
  data/syllablePool.ts        authentic syllables + surnames (do not regenerate)
  lib/
    types.ts                  shared Profile / NameResult types
    season.ts                 birth date → season + 오행 element
    myeonghak.ts              성명학 engine (소리오행·사주 용신·수리·음양)
    nameGenerator.ts          composes the name using the 성명학 engine
    api.ts                    edge-function call + graceful fallback
    supabase.ts               browser client (anon, optional)
  components/
    Landing.tsx               hero / CTA
    quiz/                      multi-step quiz (config-driven)
    Analyzing.tsx             staged "analyzing" animation
    NameCard.tsx              the poster (screen + 1:1 + 9:16 export)
    ResultCard.tsx            result page: export, share, email
  i18n.ts, locales/en.json, locales/ar.json
supabase/
  migrations/0001_init.sql    generations + emails (+ RLS)
  functions/generate-name/    the Anthropic proxy
  functions/_shared/          Deno copies of the pool + generator
```

---

Made with care · **K-Name**
