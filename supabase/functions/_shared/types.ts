import type { Tag } from "./syllablePool.ts";

export type Locale = "en" | "ar";
export type NameFeel = "masc" | "fem" | "neutral";
export type SoundLike = "yes" | "mix" | "no";

export interface Profile {
  realName: string;
  nameFeel: NameFeel;
  soundLike: SoundLike;
  birthDate: string;
  traits: Tag[];
  value: Tag;
  aspiration: string;
  vibe: string;
  element: Tag;
  country?: string;
  words3?: string;
  favKorean?: string;
  unique?: string;
  kFav?: string;
  oneWord?: string;
  handle?: string;
  handleOptIn?: boolean;
}

export interface ResultSyllable {
  hangul: string;
  hanja: string;
  meaning_en: string;
  meaning_ar: string;
}

export interface ElementInfo {
  element: string;
  hanja: string;
  label_en: string;
  label_ar: string;
}

export interface NameAnalysis {
  yongsin: ElementInfo;
  dominant: ElementInfo;
  saju_en: string;
  saju_ar: string;
  soundFlow: {
    nodes: { hangul: string; element: string; hanja: string }[];
    harmonious: boolean;
    desc_en: string;
    desc_ar: string;
  };
  numerology: {
    luckyCount: number;
    chong: number;
    desc_en: string;
    desc_ar: string;
  };
  yinYang: { pattern: string; balanced: boolean };
}

export interface NameResult {
  surname?: { hangul: string; romanization: string; reason_en: string; reason_ar: string };
  givenName: { hangul: string; romanization: string };
  archetype_en?: string;
  archetype_ar?: string;
  syllables: ResultSyllable[];
  fullName: { hangul: string; romanization: string };
  narrative_en: string;
  narrative_ar: string;
  element_en: string;
  element_ar: string;
  pronunciation: string;
  hidden_en?: string;
  hidden_ar?: string;
  analysis?: NameAnalysis;
  generation_id?: string;
  source?: string;
}
