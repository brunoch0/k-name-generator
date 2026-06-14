import { forwardRef, Fragment } from "react";
import { useTranslation } from "react-i18next";
import type { NameResult, Locale } from "../lib/types";

export type CardMode = "screen" | "square" | "story";

const SIZE: Record<CardMode, { w: number | string; h: number | string }> = {
  screen: { w: "100%", h: "auto" },
  square: { w: 540, h: 540 },
  story: { w: 540, h: 960 },
};

interface Props {
  result: NameResult;
  showHidden: boolean;
  mode: CardMode;
  /** opt-in social handle → renders "@handle's Korean name" */
  handle?: string;
  /** play the brush-reveal animation (screen mode, first show) */
  animate?: boolean;
}

/**
 * The instagrammable poster. The same component renders the on-screen preview
 * and the fixed-ratio export canvases (captured by html-to-image).
 */
const NameCard = forwardRef<HTMLDivElement, Props>(function NameCard(
  { result, showHidden, mode, handle, animate },
  ref,
) {
  const { t, i18n } = useTranslation();
  const loc = (i18n.language === "ar" ? "ar" : "en") as Locale;
  const pick = (en: string, ar: string) => (loc === "ar" ? ar : en);
  const dir = loc === "ar" ? "rtl" : "ltr";

  const size = SIZE[mode];
  const isExport = mode !== "screen";
  const late = animate && mode === "screen" ? "reveal-late" : "";
  const heroSize = mode === "story" ? 116 : mode === "square" ? 82 : 92;
  const eyebrow = handle ? t("result.yourNameHandle", { handle }) : t("result.yourName");
  const hasElementLine = Boolean((loc === "ar" ? result.element_ar : result.element_en).trim());

  return (
    <div
      ref={ref}
      dir={dir}
      style={{ width: size.w, height: size.h }}
      className="card-grain relative flex flex-col overflow-hidden rounded-[28px]"
    >
      {/* background */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(120% 80% at 0% 0%, #fbe7e0 0%, transparent 55%)," +
            "radial-gradient(120% 90% at 100% 0%, #f0e6d4 0%, transparent 50%)," +
            "linear-gradient(160deg, #fffaf6 0%, #f8ece2 55%, #f3e2da 100%)",
        }}
      />
      {/* hanja watermark */}
      <span
        aria-hidden
        className="font-hangul pointer-events-none absolute -bottom-10 end-[-12px] select-none font-black leading-none text-rose/[0.06]"
        style={{ fontSize: isExport ? 360 : 240 }}
      >
        名
      </span>

      <div
        className={`relative flex flex-1 flex-col ${
          mode === "story" ? "justify-center gap-7 px-9 py-10" : "justify-center gap-4 px-7 py-7"
        }`}
      >
        {/* header */}
        <div className="flex items-center justify-between text-rose">
          <span className="text-sm font-extrabold tracking-tight">
            <span className="font-hangul">名</span> {t("brand")}
          </span>
          <span className="rounded-full bg-white/70 px-3 py-1 text-[11px] font-semibold text-clay shadow-sm">
            {result.analysis
              ? `${result.analysis.yongsin.hanja} ${pick(result.analysis.yongsin.label_en, result.analysis.yongsin.label_ar)}`
              : pick(result.element_en, result.element_ar).split(/[,،]/)[0].slice(0, 26)}
          </span>
        </div>

        {/* hero */}
        <div className="text-center">
          <div className={`text-xs font-semibold tracking-[0.2em] text-clay ${handle ? "" : "uppercase"}`}>
            {eyebrow}
          </div>
          <div
            className={`font-brush mt-2 leading-none text-ink ${animate && mode === "screen" ? "brush-reveal" : ""}`}
            style={{ fontSize: heroSize }}
          >
            {result.fullName.hangul}
          </div>
          <div
            className={`mt-3 font-bold tracking-tight text-rose ${late}`}
            style={{ fontSize: mode === "story" ? 30 : 24 }}
          >
            {result.fullName.romanization}
          </div>
        </div>

        {/* syllable meanings */}
        <div className={`flex justify-center gap-3 ${late}`}>
          {result.syllables.map((s, idx) => (
            <div
              key={idx}
              className="flex min-w-[118px] flex-col items-center rounded-2xl bg-white/75 px-3 py-3 shadow-sm"
            >
              <div className="font-hangul-serif text-2xl font-extrabold text-ink">
                {s.hangul}
                {s.hanja && <span className="ms-1 text-base font-bold text-clay">{s.hanja}</span>}
              </div>
              <div className="mt-1 text-center text-[12px] leading-tight text-ink/65">
                {pick(s.meaning_en, s.meaning_ar).split(/[,،]/)[0]}
              </div>
            </div>
          ))}
        </div>

        {/* 소리오행 sound-element flow + 사주 보충 */}
        {result.analysis && (
          <div className={`flex flex-col items-center gap-1.5 ${late}`}>
            <div className="flex items-center gap-1.5">
              {result.analysis.soundFlow.nodes.map((n, i) => (
                <Fragment key={i}>
                  {i > 0 && <span className="text-sm text-clay/50">→</span>}
                  <span className="font-hangul rounded-lg bg-white/70 px-2 py-1 text-xs font-bold text-ink/80 shadow-sm">
                    {n.hangul}
                    <span className="ms-0.5 text-clay">{n.hanja}</span>
                  </span>
                </Fragment>
              ))}
            </div>
            <div className="flex items-center gap-2 text-[11px] font-semibold">
              {result.analysis.soundFlow.harmonious && (
                <span className="text-sage">{t("reading.harmonious")}</span>
              )}
              <span className="text-clay">
                {t("reading.needs")} {result.analysis.yongsin.hanja}
              </span>
            </div>
          </div>
        )}

        {/* narrative */}
        <p
          className={`text-center font-medium leading-relaxed text-ink/75 ${late}`}
          style={{ fontSize: mode === "story" ? 17 : 14 }}
        >
          {pick(result.narrative_en, result.narrative_ar)}
        </p>

        {/* element + pronunciation */}
        <div className={`space-y-1.5 text-center text-[12.5px] text-ink/55 ${late}`}>
          {hasElementLine && <p>{pick(result.element_en, result.element_ar)}</p>}
          <p>{result.pronunciation}</p>
        </div>

        {/* hidden meaning */}
        {showHidden && (result.hidden_en || result.hidden_ar) && (
          <div className="animate-fade-in rounded-2xl border border-gold/40 bg-gold/10 px-4 py-3 text-center">
            <div className="text-[10px] font-bold uppercase tracking-wider text-gold">
              {t("result.hiddenTitle")}
            </div>
            <p className="mt-1 text-[13px] leading-snug text-ink/75">
              {pick(result.hidden_en ?? "", result.hidden_ar ?? "")}
            </p>
          </div>
        )}

        {/* footer */}
        <div className="mt-1 flex items-center justify-between border-t border-clay/15 pt-3 text-[11.5px] text-ink/45">
          <span className="font-semibold">{t("footer.handle")}</span>
          <span className="font-bold text-rose">{t("result.cardCta")}</span>
        </div>
      </div>
    </div>
  );
});

export default NameCard;
