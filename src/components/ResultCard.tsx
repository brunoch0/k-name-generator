import { useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { toPng } from "html-to-image";
import type { NameResult, Profile } from "../lib/types";
import { saveEmail, saveHandcraftRequest, markHandcraftShared } from "../lib/api";
import NameCard from "./NameCard";
import LanguageToggle from "./LanguageToggle";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Build an @font-face for the brush font containing ONLY the glyphs in `text`
 * (via Google Fonts' `text=` subset param), inlined as a data URI. Passing this
 * to html-to-image's `fontEmbedCSS` makes the exported PNG render the name in
 * the handwriting brush font — without scanning (and erroring on) other fonts.
 */
const brushCssCache = new Map<string, string>();
async function brushFontEmbedCSS(text: string): Promise<string> {
  if (brushCssCache.has(text)) return brushCssCache.get(text)!;
  try {
    const cssUrl = `https://fonts.googleapis.com/css2?family=Nanum+Brush+Script&text=${encodeURIComponent(text)}`;
    const css = await (await fetch(cssUrl)).text();
    const m = css.match(/url\((https:\/\/[^)]+\.woff2)\)/);
    if (!m) return "";
    const buf = await (await fetch(m[1])).arrayBuffer();
    const bytes = new Uint8Array(buf);
    let bin = "";
    for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
    const b64 = btoa(bin);
    const face = `@font-face{font-family:'Nanum Brush Script';font-style:normal;font-weight:400;src:url(data:font/woff2;base64,${b64}) format('woff2');}`;
    brushCssCache.set(text, face);
    return face;
  } catch {
    return "";
  }
}

export default function ResultCard({
  result,
  profile,
  onAnother,
  onRestart,
  regenerating,
}: {
  result: NameResult;
  profile?: Profile;
  onAnother: () => void;
  onRestart: () => void;
  regenerating: boolean;
}) {
  const { t, i18n } = useTranslation();
  const loc = i18n.language === "ar" ? "ar" : "en";
  const pick = (en: string, ar: string) => (loc === "ar" ? ar : en);
  const squareRef = useRef<HTMLDivElement>(null);
  const storyRef = useRef<HTMLDivElement>(null);

  // opt-in social handle (strictly only when the user allowed it)
  const handle = profile?.handleOptIn && profile?.handle ? profile.handle : undefined;

  // Lemon Squeezy hosted checkout for the hand-brushed tier. When unset, the
  // section falls back to a free email request so it still works.
  const checkoutUrl = (import.meta.env.VITE_HANDCRAFT_CHECKOUT_URL ?? "").trim();
  const payHandcraft = () => {
    if (checkoutUrl) window.open(checkoutUrl, "_blank", "noopener,noreferrer");
  };

  const [showHidden, setShowHidden] = useState(false);
  const [busy, setBusy] = useState<"square" | "story" | null>(null);
  const [shareNote, setShareNote] = useState<string | null>(null);
  const [hasShared, setHasShared] = useState(false);

  const [email, setEmail] = useState("");
  const [emailState, setEmailState] = useState<"idle" | "error" | "done">("idle");

  // handcraft (human-touch) request
  const [hcEmail, setHcEmail] = useState("");
  const [hcState, setHcState] = useState<"idle" | "error" | "done">("idle");

  async function download(mode: "square" | "story") {
    const node = mode === "square" ? squareRef.current : storyRef.current;
    if (!node) return;
    setBusy(mode);
    try {
      await document.fonts.ready;
      // double rAF so layout/fonts settle before capture
      await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
      // Embed ONLY the brush font (subset to the name's glyphs) so the hero name
      // is hand-brushed in the PNG; other text falls back to clean system fonts.
      // Providing fontEmbedCSS also stops html-to-image scanning cross-origin
      // sheets (no SecurityError noise).
      const fontEmbedCSS = await brushFontEmbedCSS(result.fullName.hangul);
      const dataUrl = await toPng(node, {
        pixelRatio: 2,
        cacheBust: true,
        fontEmbedCSS,
        backgroundColor: "#fdf8f3",
      });
      const link = document.createElement("a");
      link.download = `k-name-${result.fullName.romanization.replace(/\s+/g, "-")}-${mode}.png`;
      link.href = dataUrl;
      link.click();
    } catch (e) {
      console.error("export failed", e);
    } finally {
      setBusy(null);
    }
  }

  async function share() {
    const url = "https://k-name-generator-chohj0228-8690s-projects.vercel.app";
    // viral hook: states their name + invites the friend to get their own
    const archetype = pick(result.archetype_en ?? "", result.archetype_ar ?? "").trim();
    const text = t(archetype ? "result.shareTextArchetype" : "result.shareText", {
      hangul: result.fullName.hangul,
      roman: result.fullName.romanization,
      archetype,
    });
    try {
      if (navigator.share) {
        await navigator.share({ title: "K-Name", text, url });
      } else {
        await navigator.clipboard.writeText(`${text} ${url}`);
        setShareNote(t("result.copied"));
        window.setTimeout(() => setShareNote(null), 2400);
      }
    } catch {
      /* user cancelled share — still unlock, it's a reward not a gate */
    } finally {
      setShowHidden(true);
      setHasShared(true);
      void markHandcraftShared(result.generation_id); // enter the draw
    }
  }

  async function submitEmail(e: React.FormEvent) {
    e.preventDefault();
    if (!EMAIL_RE.test(email.trim())) {
      setEmailState("error");
      return;
    }
    const ok = await saveEmail(email.trim(), result);
    setEmailState(ok ? "done" : "error");
  }

  async function submitHandcraft(e: React.FormEvent) {
    e.preventDefault();
    if (!EMAIL_RE.test(hcEmail.trim())) {
      setHcState("error");
      return;
    }
    const ok = await saveHandcraftRequest(hcEmail.trim(), result.generation_id, hasShared);
    setHcState(ok ? "done" : "error");
  }

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-md flex-col px-5 py-6">
      <header className="flex items-center justify-between">
        <div className="flex items-center gap-2 font-extrabold tracking-tight">
          <span className="font-hangul text-rose">名</span> {t("brand")}
        </div>
        <LanguageToggle />
      </header>

      {/* on-screen card — key forces the brush-reveal to replay on each new name */}
      <div className="mt-5 animate-scale-in">
        <div className="shadow-2xl shadow-rose/15 rounded-[28px]">
          <NameCard
            key={result.fullName.hangul}
            result={result}
            showHidden={showHidden}
            mode="screen"
            realName={profile?.realName}
            handle={handle}
            animate
          />
        </div>
      </div>

      {/* 작명 풀이 — name reading (screen only, not in the exported image) */}
      {result.analysis && (
        <section className="mt-4 rounded-3xl border border-clay/15 bg-white/70 p-5 shadow-sm">
          <h3 className="text-center text-base font-extrabold text-ink">{t("reading.title")}</h3>
          <p className="mb-4 text-center text-xs text-ink/60">{t("reading.subtitle")}</p>
          <div className="space-y-3 text-sm leading-relaxed text-ink/85">
            <div>
              <div className="mb-0.5 text-xs font-bold uppercase tracking-wide text-clay">
                {t("reading.saju")}
              </div>
              {pick(result.analysis.saju_en, result.analysis.saju_ar)}
            </div>
            <div>
              <div className="mb-0.5 text-xs font-bold uppercase tracking-wide text-clay">
                {t("reading.flow")}
              </div>
              {pick(result.analysis.soundFlow.desc_en, result.analysis.soundFlow.desc_ar)}
            </div>
            <div>
              <div className="mb-0.5 text-xs font-bold uppercase tracking-wide text-clay">
                {t("reading.numerology")}
              </div>
              {pick(result.analysis.numerology.desc_en, result.analysis.numerology.desc_ar)}
              <span className="ms-1 text-ink/45">· 음양 {result.analysis.yinYang.pattern}</span>
            </div>
          </div>
        </section>
      )}

      {/* primary viral action — share with friends */}
      <button type="button" onClick={share} className="btn-primary mt-5 w-full text-base">
        {t("result.shareFriends")}
      </button>
      <p className="mt-2 text-center text-xs font-medium text-ink/50">
        {shareNote ? shareNote : showHidden ? t("result.shared") : t("result.shareUnlockHint")}
      </p>

      {/* export */}
      <div className="mt-4 grid grid-cols-2 gap-3">
        <button
          type="button"
          className="btn-ghost"
          disabled={busy !== null}
          onClick={() => download("square")}
        >
          {busy === "square" ? "…" : t("result.downloadPost")}
        </button>
        <button
          type="button"
          className="btn-ghost"
          disabled={busy !== null}
          onClick={() => download("story")}
        >
          {busy === "story" ? "…" : t("result.downloadStory")}
        </button>
      </div>

      {/* generate another / restart */}
      <div className="mt-3 grid grid-cols-2 gap-3">
        <button
          type="button"
          className="btn-ghost"
          disabled={regenerating}
          onClick={onAnother}
        >
          {regenerating ? t("result.regenerating") : t("result.another")}
        </button>
        <button type="button" className="btn-ghost" onClick={onRestart}>
          {t("result.restart")}
        </button>
      </div>

      {/* email capture */}
      <div className="mt-6 rounded-3xl border border-clay/15 bg-white/70 p-5 shadow-sm">
        {emailState === "done" ? (
          <p className="text-center font-semibold text-sage">{t("result.emailThanks")}</p>
        ) : (
          <form onSubmit={submitEmail}>
            <div className="font-bold text-ink">{t("result.emailTitle")}</div>
            <p className="mt-1 text-sm text-ink/55">{t("result.emailSub")}</p>
            <input
              type="email"
              className="field mt-3 !py-3 !text-base"
              placeholder={t("result.emailPlaceholder")}
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (emailState === "error") setEmailState("idle");
              }}
            />
            <button type="submit" className="btn-primary mt-2 w-full !py-3">
              {t("result.emailButton")}
            </button>
            {emailState === "error" && (
              <p className="mt-2 text-sm text-rose">{t("result.emailInvalid")}</p>
            )}
          </form>
        )}
      </div>

      {/* ── Human-touch premium tier ─────────────────────────────────────── */}
      <section className="mt-6 overflow-hidden rounded-3xl border border-gold/30 bg-gradient-to-b from-gold/[0.07] to-rose/[0.05] p-5 shadow-sm">
        <span className="inline-block rounded-full bg-gold/15 px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-gold">
          {t("handcraft.eyebrow")}
        </span>
        <p className="mt-3 text-sm italic leading-relaxed text-ink/70">{t("handcraft.story")}</p>
        <div className="mt-3 flex items-baseline justify-between">
          <h3 className="font-brush text-2xl text-ink">{t("handcraft.title")}</h3>
          <span className="shrink-0 rounded-full bg-ink px-3 py-1 text-sm font-extrabold text-cream shadow">
            {t("handcraft.price")}
          </span>
        </div>
        <p className="mt-1 text-sm text-ink/65">{t("handcraft.sub")}</p>

        <div className="mt-3 rounded-2xl bg-white/70 px-4 py-2.5 text-center text-[13px] font-bold text-rose">
          {hasShared ? t("handcraft.entered") : t("handcraft.scarcity")}
        </div>

        {checkoutUrl ? (
          // Paid checkout (Lemon Squeezy) — collects email + payment on their side
          <div className="mt-4">
            <button type="button" onClick={payHandcraft} className="btn-primary w-full !py-3.5 text-base">
              {t("handcraft.reserve", { price: t("handcraft.price") })}
            </button>
            <p className="mt-2 text-center text-xs font-medium text-ink/55">{t("handcraft.payNote")}</p>
          </div>
        ) : hcState === "done" ? (
          <p className="mt-4 text-center font-semibold text-sage">{t("handcraft.thanks")}</p>
        ) : (
          <form onSubmit={submitHandcraft} className="mt-4">
            <input
              type="email"
              className="field !py-3 !text-base"
              placeholder={t("result.emailPlaceholder")}
              value={hcEmail}
              onChange={(e) => {
                setHcEmail(e.target.value);
                if (hcState === "error") setHcState("idle");
              }}
            />
            <button type="submit" className="btn-primary mt-2 w-full !py-3">
              {t("handcraft.button")}
            </button>
            {hcState === "error" && (
              <p className="mt-2 text-sm text-rose">{t("result.emailInvalid")}</p>
            )}
          </form>
        )}

        <p className="mt-4 border-t border-gold/20 pt-3 text-xs leading-relaxed text-ink/50">
          {t("handcraft.special")}
        </p>
      </section>

      <footer className="mt-6 text-center text-xs text-ink/40">{t("footer.tagline")}</footer>

      {/* offscreen export canvases */}
      <div
        aria-hidden
        style={{ position: "fixed", left: -99999, top: 0, pointerEvents: "none", opacity: 1 }}
      >
        <NameCard ref={squareRef} result={result} showHidden={showHidden} mode="square" realName={profile?.realName} handle={handle} />
        <NameCard ref={storyRef} result={result} showHidden={showHidden} mode="story" realName={profile?.realName} handle={handle} />
      </div>
    </div>
  );
}
