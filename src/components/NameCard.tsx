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
  /** the name the user entered → renders "[name]'s Korean name" */
  realName?: string;
  /** opt-in social handle → renders "@handle's Korean name" (takes precedence) */
  handle?: string;
  /** play the brush-reveal animation (screen mode, first show) */
  animate?: boolean;
}

/**
 * The instagrammable poster. The same component renders the on-screen preview
 * and the fixed-ratio export canvases (captured by html-to-image).
 */
const NameCard = forwardRef<HTMLDivElement, Props>(function NameCard(
  { result, showHidden, mode, realName, handle, animate },
  ref,
) {
  const { t, i18n } = useTranslation();
  const loc = (i18n.language === "ar" ? "ar" : "en") as Locale;
  const pick = (en: string, ar: string) => (loc === "ar" ? ar : en);
  const dir = loc === "ar" ? "rtl" : "ltr";

  const size = SIZE[mode];
  const isExport = mode !== "screen";
  const late = animate && mode === "screen" ? "reveal-late" : "";
  // a 2-syllable given name is short → render it large
  const heroSize = mode === "story" ? 132 : mode === "square" ? 96 : 104;
  const eyebrow = handle
    ? t("result.yourNameHandle", { handle })
    : realName
      ? t("result.yourNamePossessive", { name: realName })
      : t("result.yourName");
  const personalized = Boolean(handle || realName);
  const archetype = pick(result.archetype_en ?? "", result.archetype_ar ?? "").trim();
  const auspicious = Boolean(result.analysis?.soundFlow.harmonious);
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
            "radial-gradient(120% 80% at 0% 0%, #f6cabb 0%, transparent 55%)," +
            "radial-gradient(120% 95% at 100% 0%, #ecd4b4 0%, transparent 52%)," +
            "linear-gradient(160deg, #fdf1e8 0%, #efd9c9 55%, #e7c4b4 100%)",
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
          <span className="rounded-full bg-white/85 px-3 py-1 text-[11px] font-bold text-clay shadow-sm">
            {result.analysis
              ? `${result.analysis.yongsin.hanja} ${pick(result.analysis.yongsin.label_en, result.analysis.yongsin.label_ar)}`
              : pick(result.element_en, result.element_ar).split(/[,،]/)[0].slice(0, 26)}
          </span>
        </div>

        {/* hero */}
        <div className="text-center">
          <div className={`text-[11px] font-bold tracking-[0.22em] text-clay ${personalized ? "" : "uppercase"}`}>
            {eyebrow}
          </div>
          <div
            className={`font-brush mt-2 leading-none text-ink ${animate && mode === "screen" ? "brush-reveal" : ""}`}
            style={{ fontSize: heroSize }}
          >
            {result.fullName.hangul}
          </div>
          <div
            className={`mt-3 font-extrabold tracking-tight text-rose ${late}`}
            style={{ fontSize: mode === "story" ? 32 : 26 }}
          >
            {result.fullName.romanization}
          </div>
          {archetype && (
            <div className={`mt-3.5 flex justify-center ${late}`}>
              <span className="inline-block rounded-full bg-ink px-4 py-1.5 text-[11px] font-bold uppercase tracking-[0.16em] text-cream shadow-md">
                {archetype}
              </span>
            </div>
          )}
        </div>

        {/* syllable meanings */}
        <div className={`flex justify-center gap-3 ${late}`}>
          {result.syllables.map((s, idx) => (
            <div
              key={idx}
              className="flex min-w-[120px] flex-col items-center gap-1.5 rounded-2xl bg-white/90 px-3 py-3.5 shadow-md"
            >
              <div className="flex items-center justify-center gap-1.5 leading-none">
                <span className="font-hangul-serif text-[26px] font-extrabold leading-none text-ink">
                  {s.hangul}
                </span>
                {s.hanja && (
                  <span className="text-lg font-bold leading-none text-clay">{s.hanja}</span>
                )}
              </div>
              <div className="text-center text-[12.5px] font-medium leading-tight text-ink/80">
                {pick(s.meaning_en, s.meaning_ar).split(/[,،]/)[0]}
              </div>
            </div>
          ))}
        </div>

        {/* 소리오행 sound-element flow + 사주 보충 */}
        {result.analysis && (
          <div className={`flex flex-col items-center gap-2 ${late}`}>
            <div className="flex items-center gap-1.5">
              {result.analysis.soundFlow.nodes.map((n, i) => (
                <Fragment key={i}>
                  {i > 0 && <span className="text-sm font-bold text-clay">→</span>}
                  <span className="font-hangul rounded-lg bg-white/90 px-2.5 py-1 text-[13px] font-bold text-ink shadow-sm">
                    {n.hangul}
                    <span className="ms-0.5 text-clay">{n.hanja}</span>
                  </span>
                </Fragment>
              ))}
            </div>
            <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wide">
              {auspicious && (
                <span className="rounded-full bg-sage/15 px-2.5 py-1 text-sage">
                  {t("reading.harmonious")}
                </span>
              )}
              <span className="rounded-full bg-rose/10 px-2.5 py-1 text-rose">
                {t("reading.needs")} {result.analysis.yongsin.hanja}
              </span>
            </div>
          </div>
        )}

        {/* narrative */}
        <p
          className={`text-center font-medium leading-relaxed text-ink/90 ${late}`}
          style={{ fontSize: mode === "story" ? 17 : 14.5 }}
        >
          {pick(result.narrative_en, result.narrative_ar)}
        </p>

        {/* element + pronunciation */}
        <div className={`space-y-1.5 text-center text-[12.5px] font-medium text-ink/70 ${late}`}>
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
        <div className="mt-1 flex items-center justify-between border-t border-clay/25 pt-3 text-[12px] text-ink/60">
          <span className="font-bold">{t("footer.handle")}</span>
          <span className="font-extrabold text-rose">{t("result.cardCta")}</span>
        </div>
      </div>
    </div>
  );
});

export default NameCard;
