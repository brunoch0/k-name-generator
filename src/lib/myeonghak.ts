// myeonghak.ts — Korean onomancy (성명학 / 姓名學) engine.
//
// Implements the layers a real 작명소 (naming house) uses:
//   ① 발음오행 (소리오행)  — initial-consonant element flow (상생/상극)
//   ② 사주 용신           — supplement the element the birth chart lacks
//   ③ 수리 81수리          — stroke-count 5-grid fortune
//   ④ 음양 균형           — odd/even (陽/陰) stroke balance
// ① is computed straight from hangul (exact). ②–④ use the curated stroke /
// 자원오행 data in syllablePool.ts (강희자전 기준, tunable).

export type Element = "wood" | "fire" | "earth" | "metal" | "water";

export const ELEMENT_HANJA: Record<Element, string> = {
  wood: "木", fire: "火", earth: "土", metal: "金", water: "水",
};

export const ELEMENT_LABEL: Record<Element, { en: string; ar: string }> = {
  wood: { en: "Wood", ar: "الخشب" },
  fire: { en: "Fire", ar: "النار" },
  earth: { en: "Earth", ar: "الأرض" },
  metal: { en: "Metal", ar: "المعدن" },
  water: { en: "Water", ar: "الماء" },
};

// 상생 (generating) cycle: 木→火→土→金→水→木
const SAENG: Record<Element, Element> = {
  wood: "fire", fire: "earth", earth: "metal", metal: "water", water: "wood",
};
// 상극 (controlling) cycle: 木→土, 土→水, 水→火, 火→金, 金→木
const GEUK: Record<Element, Element> = {
  wood: "earth", earth: "water", water: "fire", fire: "metal", metal: "wood",
};

export type Relation = "saeng" | "geuk" | "same" | "other";

/** Relationship from element a to element b (reading a → b). */
export function relation(a: Element, b: Element): Relation {
  if (a === b) return "same";
  if (SAENG[a] === b) return "saeng"; // a generates b — auspicious
  if (GEUK[a] === b) return "geuk"; // a controls b — clashing
  return "other"; // b generates/controls a (설기/역극) — mildly weak
}

// ── ① 발음오행: initial consonant → element ─────────────────────────────────
// ㄱㅋㄲ→木 · ㄴㄷㄹㅌㄸ→火 · ㅇㅎ→土 · ㅅㅈㅊㅆㅉ→金 · ㅁㅂㅍㅃ→水
const CHO = [
  "ㄱ","ㄲ","ㄴ","ㄷ","ㄸ","ㄹ","ㅁ","ㅂ","ㅃ","ㅅ",
  "ㅆ","ㅇ","ㅈ","ㅉ","ㅊ","ㅋ","ㅌ","ㅍ","ㅎ",
];
const CHO_ELEMENT: Record<string, Element> = {
  ㄱ: "wood", ㄲ: "wood", ㅋ: "wood",
  ㄴ: "fire", ㄷ: "fire", ㄸ: "fire", ㄹ: "fire", ㅌ: "fire",
  ㅇ: "earth", ㅎ: "earth",
  ㅅ: "metal", ㅆ: "metal", ㅈ: "metal", ㅉ: "metal", ㅊ: "metal",
  ㅁ: "water", ㅂ: "water", ㅃ: "water", ㅍ: "water",
};

/** Element of a hangul syllable's initial sound (소리오행). */
export function soundElement(syllable: string): Element {
  const code = syllable.charCodeAt(0) - 0xac00;
  if (code < 0 || code > 11171) return "earth";
  const cho = CHO[Math.floor(code / 588)];
  return CHO_ELEMENT[cho] ?? "earth";
}

export interface SoundNode {
  hangul: string;
  element: Element;
}

export interface SoundFlow {
  nodes: SoundNode[];
  harmonious: boolean; // no 상극 and at least one 상생
  score: number; // higher = better
}

/** Evaluate the sound-element flow across a sequence of syllables.
 *  For a 2-syllable given name this is 이름1 → 이름2 (one transition). */
export function evaluateSoundFlow(syllables: string[]): SoundFlow {
  const nodes: SoundNode[] = syllables.map((h) => ({ hangul: h, element: soundElement(h) }));
  let score = 0;
  let clash = false;
  let anySaeng = false;
  for (let i = 0; i < nodes.length - 1; i++) {
    const r = relation(nodes[i].element, nodes[i + 1].element);
    if (r === "saeng") { score += 10; anySaeng = true; }
    else if (r === "same") { score += 2; }
    else if (r === "geuk") { score -= 12; clash = true; }
    else { score -= 2; }
  }
  return { nodes, harmonious: !clash && anySaeng, score };
}

// ── ④ 음양 (陰陽) balance ────────────────────────────────────────────────────
/** odd strokes = 陽(yang), even = 陰(yin). A mixed pattern is auspicious. */
export function yinYang(strokes: number[]): { pattern: string; balanced: boolean; score: number } {
  const pattern = strokes.map((s) => (s % 2 === 1 ? "陽" : "陰")).join("");
  const yang = strokes.filter((s) => s % 2 === 1).length;
  const yin = strokes.length - yang;
  // all-same (전부 양 or 전부 음) is the only clearly-bad case
  const balanced = yang !== 0 && yin !== 0;
  return { pattern, balanced, score: balanced ? 4 : -4 };
}

// ── ③ 수리 81수리 (劃數) ─────────────────────────────────────────────────────
// Auspicious numbers in the 81-수리 fortune table.
const LUCKY81 = new Set([
  1, 3, 5, 6, 7, 8, 11, 13, 15, 16, 17, 18, 21, 23, 24, 25, 29, 31, 32, 33,
  35, 37, 39, 41, 45, 47, 48, 52, 57, 61, 63, 65, 67, 68, 81,
]);

const norm81 = (n: number): number => {
  let v = n;
  while (v > 80) v -= 80;
  return v === 0 ? 80 : v;
};
const isLucky = (n: number): boolean => LUCKY81.has(norm81(n));

export interface Numerology {
  cheon: number; // 천격
  in: number; // 인격
  ji: number; // 지격
  oe: number; // 외격
  chong: number; // 총격
  luckyCount: number; // of the 5 격, how many are 길수
  score: number;
}

/** 5-grid (오격) numerology for a single-character surname + 2-char name. */
export function numerology(surnameStrokes: number, g1: number, g2: number): Numerology {
  const cheon = surnameStrokes + 1; // 가성수
  const inGrid = surnameStrokes + g1;
  const ji = g1 + g2;
  const oe = g2 + 1; // single surname + 2-char name → 가성수
  const chong = surnameStrokes + g1 + g2;
  const grids = [cheon, inGrid, ji, oe, chong];
  const luckyCount = grids.filter(isLucky).length;
  return { cheon, in: inGrid, ji, oe, chong, luckyCount, score: luckyCount * 4 - (5 - luckyCount) * 3 };
}

/** 수리 for a 2-syllable given name (no surname): 지격 = 이름 두 글자 획수 합. */
export function givenNumerology(g1: number, g2: number): {
  ji: number;
  lucky: boolean;
  luckyCount: number;
  score: number;
} {
  const ji = g1 + g2;
  const lucky = isLucky(ji);
  return { ji, lucky, luckyCount: lucky ? 1 : 0, score: lucky ? 8 : -4 };
}

export function chongFortune(chong: number): { en: string; ar: string } {
  return isLucky(chong)
    ? { en: "an auspicious total-fortune number (총격)", ar: "رقم الطالع الكلّي ميمون (총격)" }
    : { en: "a balanced total-fortune number (총격)", ar: "رقم الطالع الكلّي متوازن (총격)" };
}

// ── ② 사주: lightweight element tally → 용신 (element to supplement) ──────────
const STEM_ELEMENT: Element[] = [
  "wood", "wood", "fire", "fire", "earth", "earth", "metal", "metal", "water", "water",
]; // 갑을병정무기경신임계
const BRANCH_ELEMENT: Element[] = [
  "water", "earth", "wood", "wood", "earth", "fire",
  "fire", "earth", "metal", "metal", "earth", "water",
]; // 자축인묘진사오미신유술해

const SEASON_ELEMENT = (month: number): Element => {
  if (month >= 3 && month <= 5) return "wood"; // 봄
  if (month === 6 || month === 7) return "fire"; // 여름
  if (month === 8) return "earth"; // 늦여름
  if (month >= 9 && month <= 11) return "metal"; // 가을
  return "water"; // 겨울
};

const ELEMENTS: Element[] = ["wood", "fire", "earth", "metal", "water"];

export interface Saju {
  counts: Record<Element, number>;
  yongsin: Element; // 부족한 오행 = 보충 대상
  dominant: Element; // 강한 오행
}

/**
 * Approximate 사주 reading from a birth date (연주 + 계절). No birth-hour /
 * 만세력, so it's entertainment-grade — but the element tally is real.
 */
export function readSaju(birthDate: string): Saju {
  const d = new Date(birthDate + "T00:00:00");
  const valid = !Number.isNaN(d.getTime());
  const year = valid ? d.getFullYear() : 2000;
  const month = valid ? d.getMonth() + 1 : 1;

  const counts: Record<Element, number> = {
    wood: 0, fire: 0, earth: 0, metal: 0, water: 0,
  };
  const stem = STEM_ELEMENT[((year - 4) % 10 + 10) % 10];
  const branch = BRANCH_ELEMENT[((year - 4) % 12 + 12) % 12];
  counts[stem] += 1;
  counts[branch] += 1;
  counts[SEASON_ELEMENT(month)] += 1;

  // 용신 = the lacking element (lowest count; tie → fixed 오행 order)
  let yongsin: Element = ELEMENTS[0];
  let dominant: Element = ELEMENTS[0];
  for (const e of ELEMENTS) {
    if (counts[e] < counts[yongsin]) yongsin = e;
    if (counts[e] > counts[dominant]) dominant = e;
  }
  return { counts, yongsin, dominant };
}
