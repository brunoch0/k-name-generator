import { useState } from "react";
import { useTranslation } from "react-i18next";
import type { Profile, NameFeel, SoundLike } from "../../lib/types";
import type { Tag } from "../../data/syllablePool";
import LanguageToggle from "../LanguageToggle";
import {
  FEEL_OPTIONS,
  SOUNDLIKE_OPTIONS,
  TRAIT_OPTIONS,
  VALUE_OPTIONS,
  ASPIRATION_OPTIONS,
  VIBE_OPTIONS,
  ELEMENT_OPTIONS,
  STEP_KEYS,
  OPTIONAL_STEPS,
  TOTAL_STEPS,
  type StepKey,
} from "./quizConfig";

type Draft = Partial<Profile> & { traits: Tag[] };

const todayISO = new Date().toISOString().slice(0, 10);

export default function Quiz({
  onComplete,
  onExit,
}: {
  onComplete: (p: Profile) => void;
  onExit: () => void;
}) {
  const { t } = useTranslation();
  const [step, setStep] = useState(1);
  const [draft, setDraft] = useState<Draft>({ traits: [] });

  const key: StepKey = STEP_KEYS[step - 1];

  const set = <K extends keyof Profile>(k: K, value: Profile[K]) =>
    setDraft((d) => ({ ...d, [k]: value }));

  const go = (n: number) => {
    if (n < 1) return onExit();
    if (n > TOTAL_STEPS) return finish();
    setStep(n);
  };

  const finish = () => {
    onComplete({
      realName: (draft.realName ?? "").trim() || "Friend",
      nameFeel: (draft.nameFeel ?? "neutral") as NameFeel,
      soundLike: (draft.soundLike ?? "mix") as SoundLike,
      birthDate: draft.birthDate ?? "",
      traits: draft.traits.length ? draft.traits : ["calm"],
      value: (draft.value ?? "growth") as Tag,
      aspiration: (draft.aspiration ?? "creator").trim() || "creator",
      vibe: draft.vibe ?? "surprise",
      element: (draft.element ?? "water") as Tag,
      words3: draft.words3?.trim() || undefined,
      favKorean: draft.favKorean?.trim() || undefined,
      unique: draft.unique?.trim() || undefined,
      handle: draft.handle?.trim().replace(/^@+/, "") || undefined,
      handleOptIn: Boolean(draft.handleOptIn && draft.handle?.trim()),
    });
  };

  const pickAndNext = <K extends keyof Profile>(k: K, value: Profile[K]) => {
    set(k, value);
    window.setTimeout(() => go(step + 1), 240);
  };

  const toggleTrait = (tag: Tag) =>
    setDraft((d) => {
      if (d.traits.includes(tag)) return { ...d, traits: d.traits.filter((x) => x !== tag) };
      if (d.traits.length >= 3) return d;
      return { ...d, traits: [...d.traits, tag] };
    });

  const canContinue = (): boolean => {
    switch (key) {
      case "intro": return (draft.realName ?? "").trim().length > 0;
      case "feel": return Boolean(draft.nameFeel);
      case "soundLike": return Boolean(draft.soundLike);
      case "birth": return Boolean(draft.birthDate);
      case "traits": return draft.traits.length >= 2;
      case "value": return Boolean(draft.value);
      case "aspiration": return (draft.aspiration ?? "").trim().length > 0;
      case "vibe": return Boolean(draft.vibe);
      case "element": return Boolean(draft.element);
      default: return true; // optional flavour steps
    }
  };

  const optional = OPTIONAL_STEPS.includes(key);
  const isLast = step === TOTAL_STEPS;

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-xl flex-col px-5 py-6">
      <header className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => go(step - 1)}
          className="text-sm font-medium text-ink/55 transition hover:text-ink"
        >
          ← {t("quiz.back")}
        </button>
        <span className="text-sm font-semibold text-ink/45">
          {t("quiz.step", { current: step, total: TOTAL_STEPS })}
        </span>
        <LanguageToggle />
      </header>

      <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-clay/15">
        <div
          className="h-full rounded-full bg-gradient-to-r from-clay to-rose transition-all duration-500"
          style={{ width: `${(step / TOTAL_STEPS) * 100}%` }}
        />
      </div>

      <main key={step} className="flex flex-1 animate-fade-up flex-col justify-center py-8">
        <Header
          title={t(`quiz.${key}.title`)}
          sub={t(`quiz.${key}.sub`)}
          optional={optional}
          optLabel={t("quiz.optional")}
        />

        <div className="mt-7">
          {key === "intro" && (
            <div className="space-y-3">
              <div>
                <label className="mb-1 block text-xs font-semibold text-ink/55">
                  {t("quiz.intro.nameLabel")}
                </label>
                <input
                  autoFocus
                  className="field"
                  placeholder={t("quiz.intro.namePlaceholder")}
                  value={draft.realName ?? ""}
                  onChange={(e) => set("realName", e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && canContinue() && go(step + 1)}
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold text-ink/55">
                  {t("quiz.intro.countryLabel")}
                </label>
                <input
                  className="field"
                  placeholder={t("quiz.intro.countryPlaceholder")}
                  value={draft.country ?? ""}
                  onChange={(e) => set("country", e.target.value)}
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold text-ink/55">
                  {t("quiz.intro.handleLabel")}
                </label>
                <input
                  className="field"
                  placeholder={t("quiz.intro.handlePlaceholder")}
                  value={draft.handle ?? ""}
                  onChange={(e) => set("handle", e.target.value)}
                />
                <label className="mt-2 flex cursor-pointer items-start gap-2.5 text-sm text-ink/65">
                  <input
                    type="checkbox"
                    className="mt-0.5 h-5 w-5 shrink-0 accent-rose"
                    checked={Boolean(draft.handleOptIn)}
                    disabled={!draft.handle?.trim()}
                    onChange={(e) => set("handleOptIn", e.target.checked)}
                  />
                  <span>{t("quiz.intro.handleOptIn")}</span>
                </label>
              </div>
            </div>
          )}

          {key === "feel" && (
            <Grid cols={3}>
              {FEEL_OPTIONS.map((o) => (
                <Tile key={o.value} active={draft.nameFeel === o.value}                  label={t(o.labelKey)} onClick={() => pickAndNext("nameFeel", o.value as NameFeel)} />
              ))}
            </Grid>
          )}

          {key === "soundLike" && (
            <Grid cols={3}>
              {SOUNDLIKE_OPTIONS.map((o) => (
                <Tile key={o.value} active={draft.soundLike === o.value}                  label={t(o.labelKey)} onClick={() => pickAndNext("soundLike", o.value as SoundLike)} />
              ))}
            </Grid>
          )}

          {key === "birth" && (
            <input
              type="date"
              max={todayISO}
              className="field"
              value={draft.birthDate ?? ""}
              onChange={(e) => set("birthDate", e.target.value)}
            />
          )}

          {key === "traits" && (
            <>
              <div className="flex flex-wrap justify-center gap-2.5">
                {TRAIT_OPTIONS.map((o) => (
                  <button key={o.value} type="button" onClick={() => toggleTrait(o.value)}
                    className={`chip ${draft.traits.includes(o.value) ? "chip-active" : ""}`}>
                    {t(o.labelKey)}
                  </button>
                ))}
              </div>
              <p className="mt-4 text-center text-sm text-ink/45">{draft.traits.length}/3</p>
            </>
          )}

          {key === "value" && (
            <Grid cols={2}>
              {VALUE_OPTIONS.map((o) => (
                <Tile key={o.value} active={draft.value === o.value}                  label={t(o.labelKey)} onClick={() => pickAndNext("value", o.value)} />
              ))}
            </Grid>
          )}

          {key === "aspiration" && (
            <>
              <Grid cols={2}>
                {ASPIRATION_OPTIONS.map((o) => (
                  <Tile key={o.value} active={draft.aspiration === o.value}                    label={t(o.labelKey)} onClick={() => set("aspiration", o.value)} />
                ))}
              </Grid>
              <input
                className="field mt-3"
                placeholder={t("aspirations.placeholder")}
                value={ASPIRATION_OPTIONS.some((o) => o.value === draft.aspiration) ? "" : draft.aspiration ?? ""}
                onChange={(e) => set("aspiration", e.target.value)}
              />
            </>
          )}

          {key === "vibe" && (
            <Grid cols={2}>
              {VIBE_OPTIONS.map((o) => (
                <Tile key={o.value} active={draft.vibe === o.value}                  label={t(o.labelKey)} onClick={() => pickAndNext("vibe", o.value)} />
              ))}
            </Grid>
          )}

          {key === "element" && (
            <Grid cols={3}>
              {ELEMENT_OPTIONS.map((o) => (
                <Tile key={o.value} active={draft.element === o.value}                  label={t(o.labelKey)} onClick={() => pickAndNext("element", o.value)} />
              ))}
            </Grid>
          )}

          {key === "words3" && (
            <input autoFocus className="field" placeholder={t("quiz.words3.placeholder")}
              value={draft.words3 ?? ""} onChange={(e) => set("words3", e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && go(step + 1)} />
          )}

          {key === "favKorean" && (
            <input autoFocus className="field" placeholder={t("quiz.favKorean.placeholder")}
              value={draft.favKorean ?? ""} onChange={(e) => set("favKorean", e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && go(step + 1)} />
          )}

          {key === "unique" && (
            <input autoFocus className="field" placeholder={t("quiz.unique.placeholder")}
              value={draft.unique ?? ""} onChange={(e) => set("unique", e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && go(step + 1)} />
          )}
        </div>
      </main>

      <footer className="flex items-center justify-between gap-3 pb-2">
        {optional ? (
          <button type="button" onClick={() => go(step + 1)} className="btn-ghost">
            {t("quiz.skip")}
          </button>
        ) : (
          <span />
        )}
        <button type="button" disabled={!canContinue()} onClick={() => go(step + 1)} className="btn-primary flex-1">
          {isLast ? t("quiz.finish") : t("quiz.next")}
        </button>
      </footer>
    </div>
  );
}

/* ── presentational helpers ───────────────────────────────────────────────── */

function Header({ title, sub, optional, optLabel }: { title: string; sub: string; optional: boolean; optLabel: string }) {
  return (
    <div className="text-center">
      {optional && (
        <span className="mb-2 inline-block rounded-full bg-clay/15 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-clay">
          {optLabel}
        </span>
      )}
      <h2 className="text-2xl font-extrabold leading-snug text-ink sm:text-3xl">{title}</h2>
      <p className="mx-auto mt-2 max-w-md text-sm text-ink/55 sm:text-base">{sub}</p>
    </div>
  );
}

function Grid({ cols, children }: { cols: 1 | 2 | 3; children: React.ReactNode }) {
  const map = { 1: "grid-cols-1", 2: "grid-cols-2", 3: "grid-cols-3" } as const;
  return <div className={`grid ${map[cols]} gap-3`}>{children}</div>;
}

function Tile({ active, label, onClick }: { active: boolean; label: string; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className={`option-tile ${active ? "option-tile-active" : ""}`}>
      <span>{label}</span>
    </button>
  );
}
