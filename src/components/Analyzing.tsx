import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

// Three deliberate, hand-crafted stages — calm ink/paper ceremony.
const STAGES = ["0", "1", "2"];
const STAGE_MS = 1200;

/** The Ritual — a ceremonial sequence shown while the name is brushed. */
export default function Analyzing({ onDone }: { onDone: () => void }) {
  const { t } = useTranslation();
  const [i, setI] = useState(0);

  useEffect(() => {
    const timers = STAGES.map((_, idx) =>
      window.setTimeout(() => setI(idx), idx * STAGE_MS),
    );
    const finish = window.setTimeout(onDone, STAGES.length * STAGE_MS + 400);
    return () => {
      timers.forEach(clearTimeout);
      clearTimeout(finish);
    };
  }, [onDone]);

  return (
    <div className="paper-bg flex min-h-screen flex-col items-center justify-center px-8 text-center">
      {/* brush / ink mark */}
      <div className="relative h-32 w-32">
        <div className="ink-splash absolute inset-0 animate-fade-in opacity-20" />
        <div className="absolute inset-4 flex items-center justify-center rounded-full border border-ink/10 bg-cream/60 shadow-inner">
          <span
            key={i}
            className="font-brush animate-scale-in text-6xl leading-none text-ink"
            style={{ position: "relative", top: "0.06em" }}
          >
            {["名", "字", "墨"][i] ?? "名"}
          </span>
        </div>
        {/* slow rotating ring to feel deliberate, not instant */}
        <div className="absolute inset-0 animate-[spin_6s_linear_infinite] rounded-full border border-dashed border-clay/30" />
      </div>

      <div className="mt-10 h-8 overflow-hidden">
        <p key={i} className="animate-fade-up font-serifko text-xl font-bold tracking-wide text-ink/85">
          {t(`ritual.${STAGES[i]}`)}
        </p>
      </div>

      <div className="mt-6 flex gap-2">
        {STAGES.map((_, idx) => (
          <span
            key={idx}
            className={`h-1 rounded-full transition-all duration-500 ${
              idx <= i ? "w-8 bg-ink/60" : "w-3 bg-ink/15"
            }`}
          />
        ))}
      </div>

      <p className="mt-8 text-xs italic text-ink/40">{t("ritual.hint")}</p>
    </div>
  );
}
