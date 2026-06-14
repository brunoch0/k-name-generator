import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import type { Profile, NameResult, Locale } from "./lib/types";
import { generateName } from "./lib/api";
import Landing from "./components/Landing";
import Quiz from "./components/quiz/Quiz";
import Analyzing from "./components/Analyzing";
import ResultCard from "./components/ResultCard";

type Stage = "landing" | "quiz" | "analyzing" | "result";

export default function App() {
  const { i18n, t } = useTranslation();
  const [stage, setStage] = useState<Stage>("landing");
  const [profile, setProfile] = useState<Profile | null>(null);
  const [result, setResult] = useState<NameResult | null>(null);
  const [variation, setVariation] = useState(0);
  const [analyzingDone, setAnalyzingDone] = useState(false);
  const [regenerating, setRegenerating] = useState(false);
  const [error, setError] = useState(false);

  const locale = (i18n.language === "ar" ? "ar" : "en") as Locale;

  const runGenerate = useCallback(
    async (p: Profile, v: number) => {
      try {
        const r = await generateName({ profile: p, locale, variation: v });
        setResult(r);
        setError(false);
      } catch {
        setError(true);
      }
    },
    [locale],
  );

  const handleComplete = (p: Profile) => {
    setProfile(p);
    setResult(null);
    setVariation(0);
    setAnalyzingDone(false);
    setError(false);
    setStage("analyzing");
    void runGenerate(p, 0);
  };

  // reveal the result only once BOTH the animation finished and the name is ready
  useEffect(() => {
    if (stage === "analyzing" && analyzingDone && (result || error)) {
      setStage("result");
    }
  }, [stage, analyzingDone, result, error]);

  const handleAnother = async () => {
    if (!profile) return;
    const next = variation + 1;
    setVariation(next);
    setRegenerating(true);
    await runGenerate(profile, next);
    setRegenerating(false);
  };

  const restart = () => {
    setStage("landing");
    setProfile(null);
    setResult(null);
    setVariation(0);
  };

  if (stage === "landing") return <Landing onStart={() => setStage("quiz")} />;

  if (stage === "quiz")
    return <Quiz onComplete={handleComplete} onExit={() => setStage("landing")} />;

  if (stage === "analyzing")
    return <Analyzing onDone={() => setAnalyzingDone(true)} />;

  // result
  if (error && !result) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 px-6 text-center">
        <p className="text-lg font-semibold text-ink/80">{t("error.generic")}</p>
        <button type="button" className="btn-primary" onClick={() => profile && handleComplete(profile)}>
          {t("error.retry")}
        </button>
      </div>
    );
  }

  return (
    result && (
      <ResultCard
        result={result}
        profile={profile ?? undefined}
        onAnother={handleAnother}
        onRestart={restart}
        regenerating={regenerating}
      />
    )
  );
}
