import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import en from "./locales/en.json";
import ar from "./locales/ar.json";
import type { Locale } from "./lib/types";

const STORAGE_KEY = "kname.locale";

function initialLocale(): Locale {
  const saved = localStorage.getItem(STORAGE_KEY);
  return saved === "ar" ? "ar" : "en"; // English default
}

i18n.use(initReactI18next).init({
  resources: {
    en: { translation: en },
    ar: { translation: ar },
  },
  lng: initialLocale(),
  fallbackLng: "en",
  interpolation: { escapeValue: false },
});

/** Keep <html> dir/lang in sync for full RTL mirroring. */
export function applyDir(locale: Locale) {
  const html = document.documentElement;
  html.lang = locale;
  html.dir = locale === "ar" ? "rtl" : "ltr";
  localStorage.setItem(STORAGE_KEY, locale);
}

applyDir(i18n.language as Locale);

i18n.on("languageChanged", (lng) => applyDir(lng as Locale));

export default i18n;
