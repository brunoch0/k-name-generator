import { SYLLABLES, type Syllable, type Tag, type ElementWord } from "./syllablePool.ts";
import type { Profile, NameResult, ElementInfo, NameAnalysis } from "./types.ts";
import { deriveSeason, isPlausibleBirth } from "./season.ts";
import {
  readSaju,
  evaluateSoundFlow,
  givenNumerology,
  yinYang,
  chongFortune,
  relation,
  soundElement,
  ELEMENT_HANJA,
  ELEMENT_LABEL,
  type Element,
} from "./myeonghak.ts";

/**
 * Deterministic 성명학 (Korean onomancy) composer — GIVEN NAME ONLY (이름, 2 음절).
 *
 * The user keeps their own family name, so we never invent a Korean surname.
 * We optimise the 2-syllable given name for:
 *   ② 사주 보충   — supply the element the birth chart lacks (용신) [primary]
 *   ① 소리오행    — 이름1 → 이름2 sound-element 상생, avoid 상극
 *   ③ 수리        — 지격 (이름 두 글자 획수 합) auspicious number
 *   ④ 음양        — balanced odd/even (陽/陰) strokes
 *   + personality, and an optional phonetic echo of the real name.
 *
 * Mirrors the data fed to Anthropic, and is the resilient offline fallback.
 */

const ROMAN: Record<string, string> = {
  민: "Min", 준: "Jun", 서: "Seo", 지: "Ji", 현: "Hyun", 우: "Woo", 윤: "Yoon",
  하: "Ha", 은: "Eun", 수: "Su", 연: "Yeon", 아: "Ah", 예: "Ye", 진: "Jin",
  호: "Ho", 재: "Jae", 영: "Young", 주: "Ju", 소: "So", 미: "Mi", 채: "Chae",
  유: "Yu", 시: "Si", 안: "An", 율: "Yul", 가: "Ga", 빈: "Bin", 건: "Gun",
  태: "Tae", 성: "Sung", 원: "Won", 린: "Rin", 강: "Kang", 솔: "Sol",
  별: "Byul", 봄: "Bom", 빛: "Bit",
};
const roman = (h: string): string => ROMAN[h] ?? h;

// Pairs that read as an awkward/negative common Korean word — never emit these.
const BLOCKED_PAIRS = new Set<string>([
  "미미", "소소", "가가", "별별", "봄봄", // childish reduplications
  "시체", "사망", // death
  "성별", // = "gender/sex"
  "빈민", // = "the poor/paupers"
  "유서", // = "will/testament" (death connotation)
  "소주", // = "soju" (the liquor)
]);

const ASPIRATION_TAGS: Record<string, Tag[]> = {
  leader: ["ambitious", "strong", "determined"],
  healer: ["warm", "calm", "peace"],
  creator: ["creative", "art", "bright"],
  explorer: ["free", "freedom", "bold"],
  achiever: ["success", "determined", "ambitious"],
};

const VIBE_TAGS: Record<string, Tag[]> = {
  surprise: [],
  soft: ["soft", "warm"],
  elegant: ["elegant"],
  cute: ["playful", "soft"],
  powerful: ["strong", "bold"],
  pure: ["calm", "elegant"],
  playful: ["playful", "bright"],
  cool: ["cool"],
};

// ── Archetype (brag-worthy identity title) ──────────────────────────────────
const VIBE_ADJ: Record<string, { en: string; ar: string }> = {
  surprise: { en: "Unexpected", ar: "المُفاجئ" },
  soft: { en: "Gentle", ar: "اللطيف" },
  elegant: { en: "Elegant", ar: "الأنيق" },
  cute: { en: "Radiant", ar: "المُشِع" },
  powerful: { en: "Bold", ar: "الجريء" },
  pure: { en: "Pure", ar: "النقيّ" },
  playful: { en: "Playful", ar: "المَرِح" },
  cool: { en: "Cool", ar: "الرائع" },
};
const ASPIRATION_NOUN: Record<string, { en: string; ar: string }> = {
  leader: { en: "Leader", ar: "القائد" },
  healer: { en: "Healer", ar: "الشافي" },
  creator: { en: "Creator", ar: "المُبدِع" },
  explorer: { en: "Explorer", ar: "المُستكشِف" },
  achiever: { en: "Achiever", ar: "المُنجِز" },
};
const ELEMENT_NOUN: Record<string, { en: string; ar: string }> = {
  water: { en: "Tide", ar: "المدّ" },
  fire: { en: "Flame", ar: "اللهب" },
  wood: { en: "Bloom", ar: "الزهرة" },
  metal: { en: "Blade", ar: "النصل" },
  earth: { en: "Mountain", ar: "الجبل" },
};

function archetypeOf(profile: Profile, element: string): { en: string; ar: string } {
  const adj = VIBE_ADJ[profile.vibe] ?? { en: "True", ar: "الأصيل" };
  const key = (profile.aspiration ?? "").trim().toLowerCase();
  const noun =
    ASPIRATION_NOUN[key] ??
    Object.keys(ASPIRATION_NOUN).map((k) => (key.includes(k) ? ASPIRATION_NOUN[k] : null)).find(Boolean) ??
    ELEMENT_NOUN[element] ??
    { en: "Soul", ar: "الروح" };
  return { en: `The ${adj.en} ${noun.en}`, ar: `${noun.ar} ${adj.ar}` };
}

function aspirationTags(aspiration: string): Tag[] {
  const key = (aspiration ?? "").trim().toLowerCase();
  if (ASPIRATION_TAGS[key]) return ASPIRATION_TAGS[key];
  for (const k of Object.keys(ASPIRATION_TAGS)) if (key.includes(k)) return ASPIRATION_TAGS[k];
  return [];
}

/** Personality tag weights (element handled separately via 사주). */
function personalityWeights(profile: Profile): Map<Tag, number> {
  const w = new Map<Tag, number>();
  const add = (t: Tag, n: number) => w.set(t, (w.get(t) ?? 0) + n);
  (profile.traits ?? []).forEach((t) => add(t, 2));
  if (profile.value) add(profile.value, 2);
  (VIBE_TAGS[profile.vibe] ?? []).forEach((t) => add(t, 2));
  aspirationTags(profile.aspiration).forEach((t) => add(t, 1));
  return w;
}

const genderOk = (s: Syllable, feel: Profile["nameFeel"]) =>
  feel === "neutral" || s.tags.includes(feel) || s.tags.includes("neutral");

function tagOverlap(s: Syllable, w: Map<Tag, number>): number {
  let n = 0;
  for (const t of s.tags) n += w.get(t) ?? 0;
  return n;
}

function naturalPair(a: Syllable, b: Syllable): boolean {
  if (a.hangul === b.hangul) return false;
  if (BLOCKED_PAIRS.has(a.hangul + b.hangul) || BLOCKED_PAIRS.has(b.hangul + a.hangul)) return false;
  return true;
}

const firstMeaning = (m: string): string => m.split(/[,،]/)[0].trim();

/** Letters that begin the real name's tokens — used for the optional sound echo. */
function realNameInitials(realName: string): Set<string> {
  return new Set(
    (realName ?? "")
      .toLowerCase()
      .split(/[^a-z]+/i)
      .filter(Boolean)
      .map((w) => w[0]),
  );
}

const elementInfo = (e: Element): ElementInfo => ({
  element: e,
  hanja: ELEMENT_HANJA[e],
  label_en: ELEMENT_LABEL[e].en,
  label_ar: ELEMENT_LABEL[e].ar,
});

export function generateNameLocal(
  profile: Profile,
  opts: { variation?: number } = {},
): NameResult {
  const variation = Math.max(0, Math.floor(opts.variation ?? 0));
  const bornOk = isPlausibleBirth(profile.birthDate);
  const saju = readSaju(profile.birthDate);
  const userElement = profile.element as ElementWord | undefined;
  // 사주 보충 element; if birth date is unusable, fall back to chosen element.
  const yongsin: Element = bornOk ? saju.yongsin : ((userElement as Element) ?? saju.yongsin);
  const weights = personalityWeights(profile);

  // optional phonetic echo of the real name (controlled by soundLike)
  const echoStrength = profile.soundLike === "yes" ? 6 : profile.soundLike === "mix" ? 3 : 0;
  const echoLetters = echoStrength ? realNameInitials(profile.realName) : new Set<string>();
  const echoBonus = (s: Syllable): number =>
    echoLetters.has(roman(s.hangul)[0]?.toLowerCase() ?? "") ? echoStrength : 0;

  const baseScore = (s: Syllable): number =>
    (s.wonOhaeng === yongsin ? 8 : 0) +
    (userElement && s.wonOhaeng === userElement ? 3 : 0) +
    tagOverlap(s, weights) +
    echoBonus(s);

  const shortlist = SYLLABLES.filter((s) => genderOk(s, profile.nameFeel))
    .map((s) => ({ s, base: baseScore(s) }))
    .sort((a, b) => b.base - a.base || a.s.hangul.localeCompare(b.s.hangul))
    .slice(0, 16);

  interface Cand {
    s1: Syllable;
    s2: Syllable;
    score: number;
    sound: ReturnType<typeof evaluateSoundFlow>;
    num: ReturnType<typeof givenNumerology>;
    yy: ReturnType<typeof yinYang>;
  }

  const cands: Cand[] = [];
  for (let i = 0; i < shortlist.length; i++) {
    for (let j = 0; j < shortlist.length; j++) {
      if (i === j) continue;
      const s1 = shortlist[i].s;
      const s2 = shortlist[j].s;
      if (!naturalPair(s1, s2)) continue;

      const sound = evaluateSoundFlow([s1.hangul, s2.hangul]);
      const num = givenNumerology(s1.strokes, s2.strokes);
      const yy = yinYang([s1.strokes, s2.strokes]);
      const supplies = (s: Syllable) =>
        s.wonOhaeng === yongsin || soundElement(s.hangul) === yongsin ? 1 : 0;
      const supplyBonus = (supplies(s1) + supplies(s2)) * 8;
      const score =
        shortlist[i].base + shortlist[j].base + supplyBonus + sound.score + num.score + yy.score;
      cands.push({ s1, s2, score, sound, num, yy });
    }
  }

  const seen = new Set<string>();
  const ranked = cands
    .sort(
      (a, b) => Number(b.sound.harmonious) - Number(a.sound.harmonious) || b.score - a.score,
    )
    .filter((c) => {
      // de-dup by visible hangul so "Generate another" always looks different
      const key = [c.s1.hangul, c.s2.hangul].sort().join("");
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

  const pick = ranked[variation % ranked.length] ?? {
    s1: shortlist[0].s, s2: shortlist[1] ? shortlist[1].s : shortlist[0].s,
    sound: evaluateSoundFlow([shortlist[0].s.hangul, shortlist[1]?.s.hangul ?? shortlist[0].s.hangul]),
    num: givenNumerology(shortlist[0].s.strokes, shortlist[1]?.s.strokes ?? 0),
    yy: yinYang([shortlist[0].s.strokes, shortlist[1]?.s.strokes ?? 0]),
    score: 0,
  };

  const { s1, s2, sound, num, yy } = pick;

  const givenHangul = s1.hangul + s2.hangul;
  const givenRoman = roman(s1.hangul) + roman(s2.hangul).toLowerCase();
  const phonetic = `${roman(s1.hangul)}-${roman(s2.hangul)}`;

  const yLabelEn = ELEMENT_LABEL[yongsin].en;
  const yLabelAr = ELEMENT_LABEL[yongsin].ar;
  const yHanja = ELEMENT_HANJA[yongsin];
  const dLabelEn = ELEMENT_LABEL[saju.dominant].en;
  const dLabelAr = ELEMENT_LABEL[saju.dominant].ar;

  const flowEn = sound.nodes.map((n) => `${n.hangul}(${ELEMENT_HANJA[n.element]})`).join(" → ");
  const flowRelEn = describeFlow(sound.nodes.map((n) => n.element), "en");
  const flowRelAr = describeFlow(sound.nodes.map((n) => n.element), "ar");
  const chongF = chongFortune(num.ji);

  const sajuEn = bornOk
    ? `Your birth chart leans strong in ${dLabelEn} (${ELEMENT_HANJA[saju.dominant]}) and runs thin in ${yLabelEn} (${yHanja}) — so your name is built to pour ${yLabelEn} back in.`
    : `Your name follows the element you're drawn to, ${yLabelEn} (${yHanja}), to keep your energy in balance.`;
  const sajuAr = bornOk
    ? `مخطط ميلادك يميل بقوّة إلى ${dLabelAr} (${ELEMENT_HANJA[saju.dominant]}) ويفتقر إلى ${yLabelAr} (${yHanja}) — لذا بُني اسمك ليعيد ${yLabelAr} إلى توازنك.`
    : `يتبع اسمك العنصر الذي تنجذب إليه، ${yLabelAr} (${yHanja})، ليحافظ على توازن طاقتك.`;

  const analysis: NameAnalysis = {
    yongsin: elementInfo(yongsin),
    dominant: elementInfo(saju.dominant),
    saju_en: sajuEn,
    saju_ar: sajuAr,
    soundFlow: {
      nodes: sound.nodes.map((n) => ({ hangul: n.hangul, element: n.element, hanja: ELEMENT_HANJA[n.element] })),
      harmonious: sound.harmonious,
      desc_en: `${flowEn} — ${flowRelEn}`,
      desc_ar: `${flowEn} — ${flowRelAr}`,
    },
    numerology: {
      luckyCount: num.luckyCount,
      chong: num.ji,
      desc_en: `Your name's strokes total ${num.ji} (지격, 이름 획수) — ${chongF.en}.`,
      desc_ar: `مجموع خطوط اسمك ${num.ji} (지격) — ${chongF.ar}.`,
    },
    yinYang: { pattern: yy.pattern, balanced: yy.balanced },
  };

  const archetype = archetypeOf(profile, yongsin);

  return {
    givenName: { hangul: givenHangul, romanization: givenRoman },
    archetype_en: archetype.en,
    archetype_ar: archetype.ar,
    syllables: [
      { hangul: s1.hangul, hanja: s1.hanja, meaning_en: s1.meaning_en, meaning_ar: s1.meaning_ar },
      { hangul: s2.hangul, hanja: s2.hanja, meaning_en: s2.meaning_en, meaning_ar: s2.meaning_ar },
    ],
    fullName: { hangul: givenHangul, romanization: givenRoman },
    narrative_en: `${s1.hangul} "${firstMeaning(s1.meaning_en)}" and ${s2.hangul} "${firstMeaning(s2.meaning_en)}" carry ${yLabelEn} (${yHanja}) — the element your chart needs — and their sounds flow in ${sound.harmonious ? "상생 harmony" : "balance"}. A given name made to complete you.`,
    narrative_ar: `${s1.hangul} "${firstMeaning(s1.meaning_ar)}" و${s2.hangul} "${firstMeaning(s2.meaning_ar)}" يحملان عنصر ${yLabelAr} (${yHanja}) الذي يحتاجه مخططك، وتتناغم أصواتهما ${sound.harmonious ? "في انسجام (상생)" : "بتوازن"}. اسمٌ صُنع ليكملك.`,
    element_en: bornOk
      ? `Born in ${deriveSeason(profile.birthDate).label_en.split(" · ")[0].toLowerCase()}, your name carries ${yLabelEn} (${yHanja}) — the 오행 element that brings your chart into balance.`
      : "",
    element_ar: bornOk
      ? `وُلدت في ${deriveSeason(profile.birthDate).label_ar.split(" · ")[0]}، ويحمل اسمك عنصر ${yLabelAr} (${yHanja}) — عنصر الـ오행 الذي يوازن مخططك.`
      : "",
    pronunciation: `${givenRoman} — say it "${phonetic}"`,
    hidden_en: `Spoken together, ${givenHangul} whispers a quiet blessing: "${firstMeaning(s1.meaning_en)} and ${firstMeaning(s2.meaning_en)}" — woven from the ${yLabelEn} your spirit was missing.`,
    hidden_ar: `حين يُنطقان معًا، يهمس ${givenHangul} ببركة هادئة: "${firstMeaning(s1.meaning_ar)} و${firstMeaning(s2.meaning_ar)}" — منسوجة من ${yLabelAr} الذي كانت روحك تفتقده.`,
    analysis,
    source: "local",
  };
}

function describeFlow(els: Element[], loc: "en" | "ar"): string {
  let clash = false;
  let anySaeng = false;
  for (let i = 0; i < els.length - 1; i++) {
    const r = relation(els[i], els[i + 1]);
    if (r === "geuk") clash = true;
    if (r === "saeng") anySaeng = true;
  }
  if (loc === "ar") {
    if (clash) return "تدفّق صوتي فيه شيء من التضادّ (상극).";
    if (anySaeng) return "تدفّق صوتي متناغم يُولّد بعضه بعضًا (상생) — يُعدّ ميمونًا.";
    return "تدفّق صوتي متوازن.";
  }
  if (clash) return "a sound flow with some 상극 (clashing) tension.";
  if (anySaeng) return "a mutually-generating 상생 sound flow — considered auspicious.";
  return "a balanced sound flow.";
}
