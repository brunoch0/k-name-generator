import { useTranslation } from "react-i18next";
import LanguageToggle from "./LanguageToggle";

export default function Landing({ onStart }: { onStart: () => void }) {
  const { t } = useTranslation();

  const features = [
    { n: "01", title: t("landing.feature1"), desc: t("landing.feature1d") },
    { n: "02", title: t("landing.feature2"), desc: t("landing.feature2d") },
    { n: "03", title: t("landing.feature3"), desc: t("landing.feature3d") },
  ];

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-3xl flex-col px-5 py-6">
      <header className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-lg font-extrabold tracking-tight">
          <span className="font-hangul text-rose">名</span> {t("brand")}
        </div>
        <LanguageToggle />
      </header>

      <main className="flex flex-1 flex-col items-center justify-center text-center">
        <div className="animate-fade-up">
          <span className="inline-block rounded-full bg-rose/10 px-4 py-1.5 text-sm font-semibold text-rose">
            {t("landing.eyebrow")}
          </span>
        </div>

        <h1 className="mt-6 animate-fade-up text-4xl font-extrabold leading-[1.12] tracking-tight text-ink sm:text-5xl">
          {t("landing.title")}
        </h1>

        <div className="mt-5 flex animate-fade-up items-center justify-center gap-3 text-5xl font-black sm:text-6xl">
          <span className="font-hangul-serif text-clay">한</span>
          <span className="font-hangul-serif text-rose">이</span>
          <span className="font-hangul-serif text-gold">름</span>
        </div>

        <p className="mt-6 max-w-xl animate-fade-up text-base leading-relaxed text-ink/80 sm:text-lg">
          {t("landing.subtitle")}
        </p>

        <button
          type="button"
          onClick={onStart}
          className="btn-primary mt-9 animate-fade-up text-lg"
        >
          {t("landing.cta")} <span aria-hidden>→</span>
        </button>
        <p className="mt-3 animate-fade-up text-sm font-medium text-ink/60">{t("landing.trust")}</p>

        <div className="mt-12 grid w-full animate-fade-up gap-4 sm:grid-cols-3">
          {features.map((f) => (
            <div
              key={f.title}
              className="rounded-2xl border border-clay/25 bg-white/80 p-5 text-start shadow-sm"
            >
              <div className="font-serifko text-sm font-bold tracking-widest text-clay">{f.n}</div>
              <div className="mt-2 font-bold text-ink">{f.title}</div>
              <div className="mt-1 text-sm text-ink/70">{f.desc}</div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
