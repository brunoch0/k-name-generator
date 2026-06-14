import { useTranslation } from "react-i18next";

export default function LanguageToggle() {
  const { i18n } = useTranslation();
  const next = i18n.language === "ar" ? "en" : "ar";

  return (
    <button
      type="button"
      onClick={() => i18n.changeLanguage(next)}
      className="btn-ghost !px-4 !py-2 text-sm"
      aria-label="Switch language"
    >
      <span aria-hidden>🌐</span>
      {next === "ar" ? "العربية" : "English"}
    </button>
  );
}
