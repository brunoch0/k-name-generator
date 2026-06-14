import type { Tag } from "./syllablePool.ts";

export type Season = "spring" | "summer" | "autumn" | "winter";

export interface SeasonInfo {
  season: Season;
  element: Tag;
  label_en: string;
  label_ar: string;
}

export function isPlausibleBirth(birthDate: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(birthDate ?? "")) return false;
  const d = new Date(birthDate + "T00:00:00");
  if (Number.isNaN(d.getTime())) return false;
  const year = d.getFullYear();
  const now = new Date().getFullYear();
  if (year < 1900 || year > now) return false;
  return true;
}

export function deriveSeason(birthDate: string): SeasonInfo {
  const d = new Date(birthDate + "T00:00:00");
  const m = Number.isNaN(d.getTime()) ? 0 : d.getMonth() + 1;

  if (m >= 3 && m <= 5) {
    return { season: "spring", element: "wood", label_en: "Spring · Wood (목)", label_ar: "الربيع · الخشب (목)" };
  }
  if (m === 6 || m === 7) {
    return { season: "summer", element: "fire", label_en: "Summer · Fire (화)", label_ar: "الصيف · النار (화)" };
  }
  if (m === 8) {
    return { season: "summer", element: "earth", label_en: "Late summer · Earth (토)", label_ar: "أواخر الصيف · الأرض (토)" };
  }
  if (m >= 9 && m <= 11) {
    return { season: "autumn", element: "metal", label_en: "Autumn · Metal (금)", label_ar: "الخريف · المعدن (금)" };
  }
  return { season: "winter", element: "water", label_en: "Winter · Water (수)", label_ar: "الشتاء · الماء (수)" };
}
