import type { Tag } from "../../data/syllablePool";

export interface Option {
  value: string;
  /** i18n key for the label */
  labelKey: string;
}

export const FEEL_OPTIONS: Option[] = [
  { value: "masc", labelKey: "quiz.feel.masc" },
  { value: "fem", labelKey: "quiz.feel.fem" },
  { value: "neutral", labelKey: "quiz.feel.neutral" },
];

export const SOUNDLIKE_OPTIONS: Option[] = [
  { value: "yes", labelKey: "quiz.soundLike.yes" },
  { value: "mix", labelKey: "quiz.soundLike.mix" },
  { value: "no", labelKey: "quiz.soundLike.no" },
];

export const TRAIT_OPTIONS: { value: Tag; labelKey: string }[] = [
  { value: "calm", labelKey: "traits.calm" },
  { value: "ambitious", labelKey: "traits.ambitious" },
  { value: "warm", labelKey: "traits.warm" },
  { value: "bold", labelKey: "traits.bold" },
  { value: "creative", labelKey: "traits.creative" },
  { value: "loyal", labelKey: "traits.loyal" },
  { value: "free", labelKey: "traits.free" },
  { value: "wise", labelKey: "traits.wise" },
  { value: "playful", labelKey: "traits.playful" },
  { value: "determined", labelKey: "traits.determined" },
];

export const VALUE_OPTIONS: { value: Tag; labelKey: string }[] = [
  { value: "success", labelKey: "values.success" },
  { value: "love", labelKey: "values.love" },
  { value: "freedom", labelKey: "values.freedom" },
  { value: "family", labelKey: "values.family" },
  { value: "growth", labelKey: "values.growth" },
  { value: "art", labelKey: "values.art" },
  { value: "peace", labelKey: "values.peace" },
];

export const ASPIRATION_OPTIONS: Option[] = [
  { value: "leader", labelKey: "aspirations.leader" },
  { value: "healer", labelKey: "aspirations.healer" },
  { value: "creator", labelKey: "aspirations.creator" },
  { value: "explorer", labelKey: "aspirations.explorer" },
  { value: "achiever", labelKey: "aspirations.achiever" },
];

// vibe id → maps to syllablePool tags in nameGenerator (VIBE_TAGS)
export const VIBE_OPTIONS: { value: string; labelKey: string }[] = [
  { value: "surprise", labelKey: "vibes.surprise" },
  { value: "soft", labelKey: "vibes.soft" },
  { value: "elegant", labelKey: "vibes.elegant" },
  { value: "cute", labelKey: "vibes.cute" },
  { value: "powerful", labelKey: "vibes.powerful" },
  { value: "pure", labelKey: "vibes.pure" },
  { value: "playful", labelKey: "vibes.playful" },
  { value: "cool", labelKey: "vibes.cool" },
];

export const ELEMENT_OPTIONS: { value: Tag; labelKey: string }[] = [
  { value: "water", labelKey: "elements.water" },
  { value: "fire", labelKey: "elements.fire" },
  { value: "wood", labelKey: "elements.wood" },
  { value: "metal", labelKey: "elements.metal" },
  { value: "earth", labelKey: "elements.earth" },
];

// step order (semantic keys) — drives titles and the Quiz switch.
// "intro" collects name + country + Instagram handle together up front.
export const STEP_KEYS = [
  "intro", "feel", "soundLike", "birth", "traits", "value",
  "aspiration", "vibe", "element", "words3", "favKorean", "unique",
] as const;

export type StepKey = (typeof STEP_KEYS)[number];

export const TOTAL_STEPS = STEP_KEYS.length; // 12

// which steps are optional (skippable)
export const OPTIONAL_STEPS: StepKey[] = ["words3", "favKorean", "unique"];
