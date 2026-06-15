import type { Tag } from "../data/syllablePool";

export type Locale = "en" | "ar";

export type NameFeel = "masc" | "fem" | "neutral";
export type SoundLike = "yes" | "mix" | "no";

/** Raw answers collected by the quiz. */
export interface Profile {
  realName: string;
  nameFeel: NameFeel;
  soundLike: SoundLike; // echo the real name's sound? yes/mix/no
  birthDate: string; // ISO yyyy-mm-dd (may be messy/invalid — handled gracefully)
  traits: Tag[]; // 2–3 trait tags
  value: Tag; // one value tag
  aspiration: string; // "leader" | "healer" | ... | free text
  vibe: string; // vibe id (see VIBE_TAGS) — maps to multiple tags
  element: Tag; // one element tag
  country?: string; // where they're from (flavour; not shown on card)
  // optional flavour fields fed to the narrative
  words3?: string; // "3 words that describe you"
  favKorean?: string; // favourite Korean words / names / sounds
  unique?: string; // one thing that makes you unique
  kFav?: string; // (legacy) favourite K-drama / K-pop artist
  oneWord?: string; // (legacy) one word for yourself
  // opt-in social handle
  handle?: string;
  handleOptIn?: boolean; // strictly opt-in to show on the card
}

/** A single syllable shown on the result card. */
export interface ResultSyllable {
  hangul: string;
  hanja: string;
  meaning_en: string;
  meaning_ar: string;
}

export interface ElementInfo {
  element: string; // wood | fire | earth | metal | water
  hanja: string; // 木 火 土 金 水
  label_en: string;
  label_ar: string;
}

/** 작명 풀이 — the 성명학 reasoning behind the name. */
export interface NameAnalysis {
  /** 사주가 보충해야 하는 오행 (용신) */
  yongsin: ElementInfo;
  /** 사주에서 강한 오행 */
  dominant: ElementInfo;
  saju_en: string;
  saju_ar: string;
  /** 소리오행 흐름 (성→이름1→이름2) */
  soundFlow: {
    nodes: { hangul: string; element: string; hanja: string }[];
    harmonious: boolean;
    desc_en: string;
    desc_ar: string;
  };
  /** 수리 81수리 */
  numerology: {
    luckyCount: number;
    chong: number;
    desc_en: string;
    desc_ar: string;
  };
  /** 음양 균형 */
  yinYang: { pattern: string; balanced: boolean };
}

/** The full generated-name payload — identical shape from Anthropic or the
 *  deterministic fallback, so the UI never has to care which produced it. */
export interface NameResult {
  /** Optional — the app generates a GIVEN name only (user keeps their family name). */
  surname?: {
    hangul: string;
    romanization: string;
    reason_en: string;
    reason_ar: string;
  };
  givenName: {
    hangul: string;
    romanization: string;
  };
  syllables: ResultSyllable[];
  fullName: {
    hangul: string;
    romanization: string;
  };
  narrative_en: string;
  narrative_ar: string;
  element_en: string;
  element_ar: string;
  pronunciation: string;
  /** Extra line unlocked by sharing. */
  hidden_en?: string;
  hidden_ar?: string;
  /** 성명학 풀이 (사주 보충 · 소리오행 · 수리 · 음양). */
  analysis?: NameAnalysis;
  /** id of the saved `generations` row (for linking emails / handcraft). */
  generation_id?: string;
  /** "anthropic" | "local" — where the name came from (telemetry/debug). */
  source?: string;
}
