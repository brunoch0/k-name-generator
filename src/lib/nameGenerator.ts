import { SYLLABLES, SURNAMES, type Syllable, type Tag, type ElementWord } from "../data/syllablePool";
import type { Profile, NameResult, ElementInfo, NameAnalysis } from "./types";
import { deriveSeason, isPlausibleBirth } from "./season";
import {
  readSaju,
  evaluateSoundFlow,
  numerology,
  yinYang,
  chongFortune,
  relation,
  soundElement,
  ELEMENT_HANJA,
  ELEMENT_LABEL,
  type Element,
} from "./myeonghak";

/**
 * Deterministic 성명학 (Korean onomancy) name composer.
 *
 * Picks the surname + 2-syllable given name jointly, optimising for:
 *   ② 사주 보충   — supply the element the birth chart lacks (용신) [primary]
 *   ① 소리오행    — 성→이름 sound-element 상생 flow, avoid 상극
 *   ③ 수리 81수리 — auspicious 5-grid stroke numbers
 *   ④ 음양        — balanced odd/even (陽/陰) strokes
 *   + personality (traits/value/vibe/aspiration) and an optional name-sound echo.
 *
 * Mirrors the data fed to Anthropic, and is the resilient offline fallback.
 */

// ── Romanization of every pool syllable (keyed by hangul) ───────────────────
const ROMAN: Record<string, string> = {
  민: "Min", 준: "Jun", 서: "Seo", 지: "Ji", 현: "Hyun", 우: "Woo", 윤: "Yoon",
  하: "Ha", 은: "Eun", 수: "Su", 연: "Yeon", 아: "Ah", 예: "Ye", 진: "Jin",
  호: "Ho", 재: "Jae", 영: "Young", 주: "Ju", 소: "So", 미: "Mi", 채: "Chae",
  유: "Yu", 시: "Si", 안: "An", 율: "Yul", 가: "Ga", 빈: "Bin", 건: "Gun",
  태: "Tae", 성: "Sung", 원: "Won", 린: "Rin", 강: "Kang", 솔: "Sol",
  별: "Byul", 봄: "Bom", 빛: "Bit",
};
const roman = (h: string): string => ROMAN[h] ?? h;

const BLOCKED_PAIRS = new Set<string>(["미미", "소소", "가가", "별별", "봄봄", "시체", "사망"]);

const ASPIRATION_TAGS: Record<string, Tag[]> = {
  leader: ["ambitious", "strong", "determined"],
  healer: ["warm", "calm", "peace"],
  creator: ["creative", "art", "bright"],
  explorer: ["free", "freedom", "bold"],
  achiever: ["success", "determined", "ambitious"],
};

function aspirationTags(aspiration: string): Tag[] {
  const key = (aspiration ?? "").trim().toLowerCase();
  if (ASPIRATION_TAGS[key]) return ASPIRATION_TAGS[key];
  for (const k of Object.keys(ASPIRATION_TAGS)) if (key.includes(k)) return ASPIRATION_TAGS[k];
  return [];
}

// vibe id → syllablePool tags (validated against the prior manual version)
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

/** Personality tag weights (element is handled separately via 사주). */
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

const INITIAL_TO_SURNAME: Record<string, string[]> = {
  k: ["Kim", "Kang"], g: ["Kang", "Kim"], l: ["Lee", "Lim"], r: ["Lee"],
  p: ["Park"], b: ["Park"], c: ["Choi"], j: ["Jung"], y: ["Yoon", "Yoo"],
  h: ["Han"], s: ["Seo"], o: ["Oh"], w: ["Yoo"], a: ["Oh"], e: ["Lee"],
  m: ["Lim"], n: ["Han"], d: ["Jung"], t: ["Choi"], f: ["Park"],
};
function echoSurnames(profile: Profile): Set<string> {
  const initial = (profile.realName?.trim()[0] ?? "").toLowerCase();
  return new Set(INITIAL_TO_SURNAME[initial] ?? []);
}

const elementInfo = (e: Element): ElementInfo => ({
  element: e,
  hanja: ELEMENT_HANJA[e],
  label_en: ELEMENT_LABEL[e].en,
  label_ar: ELEMENT_LABEL[e].ar,
});

// ── main ────────────────────────────────────────────────────────────────────
export function generateNameLocal(
  profile: Profile,
  opts: { variation?: number } = {},
): NameResult {
  const variation = Math.max(0, Math.floor(opts.variation ?? 0));
  const bornOk = isPlausibleBirth(profile.birthDate);
  const saju = readSaju(profile.birthDate);
  const userElement = profile.element as ElementWord | undefined; // 사용자 선택 (secondary)
  // 보충 대상: birth-chart 용신 when the date is usable, else the chosen element
  const yongsin: Element = (!bornOk && userElement ? userElement : saju.yongsin) as Element;
  const weights = personalityWeights(profile);

  // sound-echo control from "should it sound like your real name?"
  const soundLike = profile.soundLike ?? "mix";
  const echoBonus = soundLike === "yes" ? 16 : soundLike === "mix" ? 7 : 0;

  // base relevance per syllable: 사주 보충 first, then user element, then traits
  const baseScore = (s: Syllable): number =>
    (s.wonOhaeng === yongsin ? 8 : 0) +
    (userElement && s.wonOhaeng === userElement ? 3 : 0) +
    tagOverlap(s, weights);

  const shortlist = SYLLABLES.filter((s) => genderOk(s, profile.nameFeel))
    .map((s) => ({ s, base: baseScore(s) }))
    .sort((a, b) => b.base - a.base || a.s.hangul.localeCompare(b.s.hangul))
    .slice(0, 16);

  const echoes = soundLike === "no" ? new Set<string>() : echoSurnames(profile);

  interface Cand {
    surname: (typeof SURNAMES)[number];
    s1: Syllable;
    s2: Syllable;
    score: number;
    sound: ReturnType<typeof evaluateSoundFlow>;
    num: ReturnType<typeof numerology>;
    yy: ReturnType<typeof yinYang>;
    echo: boolean;
  }

  const cands: Cand[] = [];
  for (const surname of SURNAMES) {
    const echo = echoes.has(surname.romanization);
    for (let i = 0; i < shortlist.length; i++) {
      for (let j = 0; j < shortlist.length; j++) {
        if (i === j) continue;
        const s1 = shortlist[i].s;
        const s2 = shortlist[j].s;
        if (!naturalPair(s1, s2)) continue;
        if (surname.hangul === s1.hangul) continue; // avoid 강 강지

        const sound = evaluateSoundFlow(surname.hangul, s1.hangul, s2.hangul);
        const num = numerology(surname.strokes, s1.strokes, s2.strokes);
        const yy = yinYang([surname.strokes, s1.strokes, s2.strokes]);
        // 사주 보충 우선: reward supplying the 용신 via 자원오행 OR 발음오행
        const supplies = (s: Syllable) =>
          s.wonOhaeng === yongsin || soundElement(s.hangul) === yongsin ? 1 : 0;
        const supplyBonus = (supplies(s1) + supplies(s2)) * 8;
        const score =
          shortlist[i].base +
          shortlist[j].base +
          supplyBonus + // 사주 보충 (primary)
          sound.score + // 소리오행 상생/상극 (heavy)
          num.score + // 수리 길흉
          yy.score + // 음양 균형
          (echo ? echoBonus : 0);
        cands.push({ surname, s1, s2, score, sound, num, yy, echo });
      }
    }
  }

  // de-dup by surname + unordered syllable set; harmonious flows rank first
  const seen = new Set<string>();
  const ranked = cands
    .sort(
      (a, b) =>
        Number(b.sound.harmonious) - Number(a.sound.harmonious) || b.score - a.score,
    )
    .filter((c) => {
      // de-dup by READING (hangul) so "generate another" gives a different-
      // sounding name, not just a different hanja for the same syllables.
      const key = c.surname.hangul + "|" + [c.s1.hangul, c.s2.hangul].sort().join("+");
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

  const pick = ranked[variation % ranked.length] ?? {
    surname: SURNAMES[0], s1: shortlist[0].s, s2: shortlist[1].s,
    sound: evaluateSoundFlow(SURNAMES[0].hangul, shortlist[0].s.hangul, shortlist[1].s.hangul),
    num: numerology(SURNAMES[0].strokes, shortlist[0].s.strokes, shortlist[1].s.strokes),
    yy: yinYang([SURNAMES[0].strokes, shortlist[0].s.strokes, shortlist[1].s.strokes]),
    echo: false, score: 0,
  };

  const { surname, s1, s2, sound, num, yy, echo } = pick;
  const season = deriveSeason(profile.birthDate);

  const givenHangul = s1.hangul + s2.hangul;
  const givenRoman = roman(s1.hangul) + roman(s2.hangul).toLowerCase();
  const fullHangul = surname.hangul + givenHangul;
  const fullRoman = `${surname.romanization} ${givenRoman}`;
  const phonetic = `${surname.romanization}, ${roman(s1.hangul)}-${roman(s2.hangul)}`;

  const yLabelEn = ELEMENT_LABEL[yongsin].en;
  const yLabelAr = ELEMENT_LABEL[yongsin].ar;
  const yHanja = ELEMENT_HANJA[yongsin];
  const dLabelEn = ELEMENT_LABEL[saju.dominant].en;
  const dLabelAr = ELEMENT_LABEL[saju.dominant].ar;

  // birthday may be messy/invalid → gracefully skip the chart + season touch
  const sajuEn = bornOk
    ? `Your birth chart leans strong in ${dLabelEn} (${ELEMENT_HANJA[saju.dominant]}) and runs thin in ${yLabelEn} (${yHanja}) — so your name is built to pour ${yLabelEn} back in.`
    : `Without a clear birth date we skipped the chart reading — instead your name leans into ${yLabelEn} (${yHanja}), the element you're drawn to.`;
  const sajuAr = bornOk
    ? `مخطط ميلادك يميل بقوّة إلى ${dLabelAr} (${ELEMENT_HANJA[saju.dominant]}) ويفتقر إلى ${yLabelAr} (${yHanja}) — لذا بُني اسمك ليعيد ${yLabelAr} إلى توازنك.`
    : `بدون تاريخ ميلاد واضح تجاوزنا قراءة المخطط — وبدلًا من ذلك يميل اسمك إلى ${yLabelAr} (${yHanja})، العنصر الذي تنجذب إليه.`;
  const elementEn = bornOk
    ? `Born in ${season.label_en.split(" · ")[0].toLowerCase()}, your name carries ${yLabelEn} (${yHanja}) — the 오행 element that brings your chart into balance.`
    : "";
  const elementAr = bornOk
    ? `وُلدت في ${season.label_ar.split(" · ")[0]}، ويحمل اسمك عنصر ${yLabelAr} (${yHanja}) — عنصر الـ오행 الذي يوازن مخططك.`
    : "";

  // ── 작명 풀이 ──
  const flowEn = sound.nodes
    .map((n) => `${n.hangul}(${ELEMENT_HANJA[n.element]})`)
    .join(" → ");
  const flowRelEn = describeFlow(sound.nodes.map((n) => n.element), "en");
  const flowRelAr = describeFlow(sound.nodes.map((n) => n.element), "ar");
  const chongF = chongFortune(num.chong);

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
      chong: num.chong,
      desc_en: `${num.luckyCount}/5 fortune-grids (오격) land on auspicious 수리 numbers; total ${num.chong} is ${chongF.en}.`,
      desc_ar: `${num.luckyCount}/5 من شبكات الطالع (오격) تقع على أرقام 수리 ميمونة؛ المجموع ${num.chong} ${chongF.ar}.`,
    },
    yinYang: { pattern: yy.pattern, balanced: yy.balanced },
  };

  const echoNote = echo
    ? ` ${surname.romanization} also echoes the sound of your own name.`
    : "";

  return {
    surname: {
      hangul: surname.hangul,
      romanization: surname.romanization,
      reason_en: `${surname.romanization} (${surname.hanja}) — "${firstMeaning(surname.meaning_en)}".${echoNote}`,
      reason_ar: `${surname.romanization} (${surname.hanja}) — "${firstMeaning(surname.meaning_ar)}".${echo ? " يردّد أيضًا وقع اسمك." : ""}`,
    },
    givenName: { hangul: givenHangul, romanization: givenRoman },
    syllables: [
      { hangul: s1.hangul, hanja: s1.hanja, meaning_en: s1.meaning_en, meaning_ar: s1.meaning_ar },
      { hangul: s2.hangul, hanja: s2.hanja, meaning_en: s2.meaning_en, meaning_ar: s2.meaning_ar },
    ],
    fullName: { hangul: fullHangul, romanization: fullRoman },
    narrative_en: `${s1.hangul} "${firstMeaning(s1.meaning_en)}" and ${s2.hangul} "${firstMeaning(s2.meaning_en)}" carry ${yLabelEn} (${yHanja}) — the element your chart needs — and their sounds flow in ${sound.harmonious ? "상생 harmony" : "balance"} with ${surname.romanization}. A name made to complete you.`,
    narrative_ar: `${s1.hangul} "${firstMeaning(s1.meaning_ar)}" و${s2.hangul} "${firstMeaning(s2.meaning_ar)}" يحملان عنصر ${yLabelAr} (${yHanja}) الذي يحتاجه مخططك، وتتناغم أصواتهما ${sound.harmonious ? "في انسجام (상생)" : "بتوازن"} مع ${surname.romanization}. اسمٌ صُنع ليكملك.`,
    element_en: elementEn,
    element_ar: elementAr,
    pronunciation: `${fullRoman} — say it "${phonetic}"`,
    hidden_en: `Spoken together, ${givenHangul} whispers a quiet blessing: "${firstMeaning(s1.meaning_en)} and ${firstMeaning(s2.meaning_en)}" — woven from the ${yLabelEn} your spirit was missing.`,
    hidden_ar: `حين يُنطقان معًا، يهمس ${givenHangul} ببركة هادئة: "${firstMeaning(s1.meaning_ar)} و${firstMeaning(s2.meaning_ar)}" — منسوجة من ${yLabelAr} الذي كانت روحك تفتقده.`,
    analysis,
    source: "local",
  };
}

// describe a 3-element flow as 상생/상극 chain
function describeFlow(els: Element[], loc: "en" | "ar"): string {
  const rels: string[] = [];
  let clash = false;
  for (let i = 0; i < els.length - 1; i++) {
    const r = relation(els[i], els[i + 1]);
    if (r === "geuk") clash = true;
    rels.push(r);
  }
  const anySaeng = rels.includes("saeng");
  if (loc === "ar") {
    if (clash) return "تدفّق صوتي فيه شيء من التضادّ (상극).";
    if (anySaeng) return "تدفّق صوتي متناغم يُولّد بعضه بعضًا (상생) — يُعدّ ميمونًا.";
    return "تدفّق صوتي متوازن.";
  }
  if (clash) return "a sound flow with some 상극 (clashing) tension.";
  if (anySaeng) return "a mutually-generating 상생 sound flow — considered auspicious.";
  return "a balanced sound flow.";
}
