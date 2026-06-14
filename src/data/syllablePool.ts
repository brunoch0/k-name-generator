// syllablePool.ts — curated authentic Korean naming data
// Each syllable is a real syllable used in Korean given names.
// Tags drive personality matching; strokes (강희자전 획수) + wonOhaeng (자원오행)
// drive the 성명학 (수리·오행) layers.

export type Tag =
  // traits
  | "calm" | "ambitious" | "warm" | "bold" | "creative"
  | "loyal" | "free" | "wise" | "playful" | "determined"
  // values
  | "success" | "love" | "freedom" | "family" | "growth" | "art" | "peace"
  // vibe
  | "soft" | "cool" | "strong" | "elegant" | "bright"
  // five elements (오행)
  | "water" | "fire" | "wood" | "metal" | "earth"
  // gender feel
  | "masc" | "fem" | "neutral";

export type ElementWord = "wood" | "fire" | "earth" | "metal" | "water";

export interface Syllable {
  hangul: string;
  hanja: string;        // "" if native Korean (순우리말)
  meaning_en: string;
  meaning_ar: string;
  tags: Tag[];
  strokes: number;      // 강희자전 원획 (한자), 순우리말은 한글 획수 근사
  wonOhaeng: ElementWord; // 자원오행 — the hanja's inherent element
}

export const SYLLABLES: Syllable[] = [
  { hangul: "민", hanja: "敏", meaning_en: "clever, quick-minded", meaning_ar: "ذكي، سريع البديهة", tags: ["wise","creative","success","cool","metal","neutral"], strokes: 11, wonOhaeng: "metal" },
  { hangul: "준", hanja: "俊", meaning_en: "talented, outstanding", meaning_ar: "موهوب، بارز", tags: ["ambitious","bold","success","strong","fire","masc"], strokes: 9, wonOhaeng: "fire" },
  { hangul: "서", hanja: "瑞", meaning_en: "auspicious, fortunate", meaning_ar: "ميمون، مبارك", tags: ["warm","peace","growth","elegant","earth","neutral"], strokes: 14, wonOhaeng: "earth" },
  { hangul: "지", hanja: "智", meaning_en: "wisdom", meaning_ar: "حكمة", tags: ["wise","calm","growth","elegant","water","neutral"], strokes: 12, wonOhaeng: "water" },
  { hangul: "지", hanja: "志", meaning_en: "will, aspiration", meaning_ar: "إرادة، طموح", tags: ["ambitious","determined","success","strong","fire","neutral"], strokes: 7, wonOhaeng: "fire" },
  { hangul: "현", hanja: "賢", meaning_en: "virtuous, wise", meaning_ar: "فاضل، حكيم", tags: ["wise","loyal","peace","elegant","water","neutral"], strokes: 15, wonOhaeng: "water" },
  { hangul: "현", hanja: "炫", meaning_en: "to shine, dazzle", meaning_ar: "يتألق، يلمع", tags: ["bold","creative","art","bright","fire","neutral"], strokes: 9, wonOhaeng: "fire" },
  { hangul: "우", hanja: "宇", meaning_en: "cosmos, universe", meaning_ar: "الكون", tags: ["free","creative","freedom","cool","earth","masc"], strokes: 6, wonOhaeng: "earth" },
  { hangul: "우", hanja: "祐", meaning_en: "blessing, divine help", meaning_ar: "بركة، عون", tags: ["warm","loyal","family","soft","metal","masc"], strokes: 10, wonOhaeng: "metal" },
  { hangul: "윤", hanja: "潤", meaning_en: "to enrich, moisten", meaning_ar: "خصب، ثراء", tags: ["warm","growth","love","soft","water","neutral"], strokes: 16, wonOhaeng: "water" },
  { hangul: "하", hanja: "河", meaning_en: "river", meaning_ar: "نهر", tags: ["calm","free","freedom","soft","water","neutral"], strokes: 9, wonOhaeng: "water" },
  { hangul: "은", hanja: "恩", meaning_en: "grace, kindness", meaning_ar: "نعمة، لطف", tags: ["warm","loyal","love","family","soft","neutral"], strokes: 10, wonOhaeng: "earth" },
  { hangul: "은", hanja: "銀", meaning_en: "silver", meaning_ar: "فضة", tags: ["elegant","cool","art","metal","fem"], strokes: 14, wonOhaeng: "metal" },
  { hangul: "수", hanja: "秀", meaning_en: "excellent, refined", meaning_ar: "بارع، راقٍ", tags: ["elegant","wise","art","soft","water","neutral"], strokes: 7, wonOhaeng: "water" },
  { hangul: "연", hanja: "妍", meaning_en: "beautiful, graceful", meaning_ar: "جميلة، رشيقة", tags: ["soft","warm","love","elegant","water","fem"], strokes: 7, wonOhaeng: "water" },
  { hangul: "연", hanja: "蓮", meaning_en: "lotus", meaning_ar: "زهرة اللوتس", tags: ["calm","peace","art","elegant","water","fem"], strokes: 17, wonOhaeng: "wood" },
  { hangul: "아", hanja: "雅", meaning_en: "elegant, refined", meaning_ar: "أنيق، راقٍ", tags: ["elegant","calm","art","soft","earth","fem"], strokes: 12, wonOhaeng: "earth" },
  { hangul: "예", hanja: "藝", meaning_en: "art, talent", meaning_ar: "فن، موهبة", tags: ["creative","art","bright","elegant","wood","fem"], strokes: 21, wonOhaeng: "wood" },
  { hangul: "예", hanja: "叡", meaning_en: "wise, insightful", meaning_ar: "حكيم، نافذ البصيرة", tags: ["wise","calm","growth","elegant","water","neutral"], strokes: 16, wonOhaeng: "water" },
  { hangul: "진", hanja: "眞", meaning_en: "truth, genuine", meaning_ar: "حقيقة، أصيل", tags: ["loyal","determined","peace","cool","metal","neutral"], strokes: 10, wonOhaeng: "metal" },
  { hangul: "진", hanja: "珍", meaning_en: "precious treasure", meaning_ar: "كنز ثمين", tags: ["love","elegant","success","bright","metal","fem"], strokes: 10, wonOhaeng: "metal" },
  { hangul: "호", hanja: "浩", meaning_en: "vast, grand", meaning_ar: "شاسع، عظيم", tags: ["bold","free","freedom","strong","water","masc"], strokes: 11, wonOhaeng: "water" },
  { hangul: "호", hanja: "昊", meaning_en: "vast sky", meaning_ar: "سماء واسعة", tags: ["free","calm","freedom","bright","fire","masc"], strokes: 8, wonOhaeng: "fire" },
  { hangul: "재", hanja: "才", meaning_en: "talent, ability", meaning_ar: "موهبة، قدرة", tags: ["creative","ambitious","success","cool","metal","masc"], strokes: 3, wonOhaeng: "metal" },
  { hangul: "영", hanja: "英", meaning_en: "brilliant, heroic", meaning_ar: "لامع، بطولي", tags: ["bold","ambitious","success","bright","wood","neutral"], strokes: 11, wonOhaeng: "wood" },
  { hangul: "영", hanja: "榮", meaning_en: "glory, flourishing", meaning_ar: "مجد، ازدهار", tags: ["success","growth","ambitious","bright","wood","neutral"], strokes: 14, wonOhaeng: "wood" },
  { hangul: "영", hanja: "映", meaning_en: "to reflect light", meaning_ar: "يعكس النور", tags: ["bright","creative","art","cool","fire","neutral"], strokes: 9, wonOhaeng: "fire" },
  { hangul: "주", hanja: "珠", meaning_en: "pearl, gem", meaning_ar: "لؤلؤة، جوهرة", tags: ["elegant","love","art","soft","metal","fem"], strokes: 11, wonOhaeng: "metal" },
  { hangul: "소", hanja: "昭", meaning_en: "bright, luminous", meaning_ar: "مشرق، ساطع", tags: ["bright","warm","playful","soft","fire","fem"], strokes: 9, wonOhaeng: "fire" },
  { hangul: "미", hanja: "美", meaning_en: "beauty", meaning_ar: "جمال", tags: ["soft","love","art","elegant","earth","fem"], strokes: 9, wonOhaeng: "earth" },
  { hangul: "채", hanja: "彩", meaning_en: "color, brilliance", meaning_ar: "ألوان، تألق", tags: ["creative","playful","art","bright","wood","fem"], strokes: 11, wonOhaeng: "wood" },
  { hangul: "유", hanja: "柔", meaning_en: "gentle, soft", meaning_ar: "لطيف، ناعم", tags: ["soft","calm","peace","warm","water","fem"], strokes: 9, wonOhaeng: "wood" },
  { hangul: "유", hanja: "裕", meaning_en: "abundant, ample", meaning_ar: "وفير، غزير", tags: ["warm","growth","family","soft","earth","neutral"], strokes: 13, wonOhaeng: "metal" },
  { hangul: "시", hanja: "詩", meaning_en: "poetry", meaning_ar: "شِعر", tags: ["creative","calm","art","elegant","water","neutral"], strokes: 13, wonOhaeng: "metal" },
  { hangul: "안", hanja: "安", meaning_en: "peace, stability", meaning_ar: "سلام، استقرار", tags: ["calm","peace","loyal","soft","earth","neutral"], strokes: 6, wonOhaeng: "earth" },
  { hangul: "율", hanja: "律", meaning_en: "rhythm, harmony", meaning_ar: "إيقاع، انسجام", tags: ["creative","free","art","cool","wood","neutral"], strokes: 9, wonOhaeng: "fire" },
  { hangul: "가", hanja: "嘉", meaning_en: "excellent, joyous", meaning_ar: "ممتاز، مبهج", tags: ["warm","playful","success","bright","earth","neutral"], strokes: 14, wonOhaeng: "wood" },
  { hangul: "빈", hanja: "彬", meaning_en: "refined, cultured", meaning_ar: "مهذّب، راقٍ", tags: ["elegant","wise","art","cool","wood","neutral"], strokes: 11, wonOhaeng: "wood" },
  { hangul: "건", hanja: "健", meaning_en: "healthy, robust", meaning_ar: "صحي، قوي", tags: ["strong","determined","family","bold","metal","masc"], strokes: 11, wonOhaeng: "wood" },
  { hangul: "태", hanja: "泰", meaning_en: "grand, tranquil", meaning_ar: "مهيب، هادئ", tags: ["calm","strong","peace","bold","earth","masc"], strokes: 10, wonOhaeng: "water" },
  { hangul: "성", hanja: "成", meaning_en: "to accomplish", meaning_ar: "إنجاز، تحقيق", tags: ["determined","ambitious","success","strong","earth","masc"], strokes: 7, wonOhaeng: "metal" },
  { hangul: "성", hanja: "星", meaning_en: "star", meaning_ar: "نجمة", tags: ["bright","free","art","creative","fire","neutral"], strokes: 9, wonOhaeng: "fire" },
  { hangul: "원", hanja: "源", meaning_en: "source, origin", meaning_ar: "منبع، أصل", tags: ["calm","growth","family","soft","water","neutral"], strokes: 14, wonOhaeng: "water" },
  { hangul: "린", hanja: "麟", meaning_en: "qilin, auspicious beast", meaning_ar: "كائن الخير الأسطوري", tags: ["bold","loyal","peace","elegant","wood","neutral"], strokes: 23, wonOhaeng: "wood" },
  { hangul: "강", hanja: "剛", meaning_en: "firm, strong", meaning_ar: "صلب، قوي", tags: ["strong","bold","determined","cool","metal","masc"], strokes: 10, wonOhaeng: "metal" },
  { hangul: "솔", hanja: "", meaning_en: "pine tree (integrity)", meaning_ar: "شجرة الصنوبر (النزاهة)", tags: ["loyal","calm","peace","strong","wood","neutral"], strokes: 8, wonOhaeng: "wood" },
  { hangul: "별", hanja: "", meaning_en: "star", meaning_ar: "نجمة", tags: ["bright","playful","art","free","fire","neutral"], strokes: 8, wonOhaeng: "fire" },
  { hangul: "봄", hanja: "", meaning_en: "spring (the season)", meaning_ar: "الربيع", tags: ["warm","growth","playful","soft","wood","fem"], strokes: 9, wonOhaeng: "wood" },
  { hangul: "빛", hanja: "", meaning_en: "light, radiance", meaning_ar: "نور، إشراق", tags: ["bright","warm","creative","bold","fire","neutral"], strokes: 9, wonOhaeng: "fire" },
];

export interface Surname {
  hangul: string;
  hanja: string;
  romanization: string;
  meaning_en: string;
  meaning_ar: string;
  strokes: number;
  wonOhaeng: ElementWord;
}

export const SURNAMES: Surname[] = [
  { hangul: "김", hanja: "金", romanization: "Kim",  meaning_en: "gold, metal",        meaning_ar: "ذهب، معدن",      strokes: 8,  wonOhaeng: "metal" },
  { hangul: "이", hanja: "李", romanization: "Lee",  meaning_en: "plum tree",          meaning_ar: "شجرة البرقوق",   strokes: 7,  wonOhaeng: "wood" },
  { hangul: "박", hanja: "朴", romanization: "Park", meaning_en: "simple, unadorned",  meaning_ar: "البساطة",        strokes: 6,  wonOhaeng: "wood" },
  { hangul: "최", hanja: "崔", romanization: "Choi", meaning_en: "lofty, towering",    meaning_ar: "شامخ، عالٍ",     strokes: 11, wonOhaeng: "earth" },
  { hangul: "정", hanja: "鄭", romanization: "Jung", meaning_en: "solemn, refined",    meaning_ar: "رزين، راقٍ",     strokes: 19, wonOhaeng: "fire" },
  { hangul: "강", hanja: "姜", romanization: "Kang", meaning_en: "ancient noble clan", meaning_ar: "عشيرة عريقة",     strokes: 9,  wonOhaeng: "wood" },
  { hangul: "윤", hanja: "尹", romanization: "Yoon", meaning_en: "governor, to lead",  meaning_ar: "حاكم، قيادة",    strokes: 4,  wonOhaeng: "earth" },
  { hangul: "한", hanja: "韓", romanization: "Han",  meaning_en: "Korea, the great",   meaning_ar: "كوريا، العظيم",  strokes: 17, wonOhaeng: "water" },
  { hangul: "서", hanja: "徐", romanization: "Seo",  meaning_en: "calm, gentle",       meaning_ar: "هادئ، لطيف",     strokes: 10, wonOhaeng: "metal" },
  { hangul: "유", hanja: "柳", romanization: "Yoo",  meaning_en: "willow tree",        meaning_ar: "شجرة الصفصاف",   strokes: 9,  wonOhaeng: "wood" },
  { hangul: "임", hanja: "林", romanization: "Lim",  meaning_en: "forest",             meaning_ar: "غابة",           strokes: 8,  wonOhaeng: "wood" },
  { hangul: "오", hanja: "吳", romanization: "Oh",   meaning_en: "ancient kingdom",    meaning_ar: "مملكة قديمة",    strokes: 7,  wonOhaeng: "earth" },
];
