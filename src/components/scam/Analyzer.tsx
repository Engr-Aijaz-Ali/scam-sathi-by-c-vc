import { useState } from "react";
import { Loader2, ScanSearch, X, AlertCircle, ShieldQuestion } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { analyzeMessage, validateMessage, EXAMPLES, MAX_LEN, type AnalysisResult } from "@/lib/analysis";
import { t, type Lang } from "@/lib/i18n";
import { ResultCard } from "./ResultCard";

export function Analyzer({ lang }: { lang: Lang }) {
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<AnalysisResult | null>(null);

  async function run() {
    const v = validateMessage(msg);
    if (v) return setError(v);
    setError(null);
    setLoading(true);
    setResult(null);
    try {
      setResult(await analyzeMessage({ message: msg.trim(), lang }));
    } catch {
      setError("errGeneric");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <div className="card-elevated p-5 sm:p-6">
        <label htmlFor="msg" className="mb-2 block font-semibold">{t(lang, "inputLabel")}</label>
        <Textarea
          id="msg"
          value={msg}
          maxLength={MAX_LEN + 100}
          onChange={(e) => { setMsg(e.target.value); if (error) setError(null); }}
          placeholder={t(lang, "placeholder")}
          className="min-h-56 resize-y bg-background/60 text-base"
          aria-invalid={!!error}
        />
        <div className="mt-1 text-right text-xs text-muted-foreground" dir="ltr">{msg.length}/{MAX_LEN}</div>

        {error && (
          <p role="alert" className="mt-2 flex items-center gap-2 rounded-lg bg-destructive/15 p-3 text-sm text-destructive">
            <AlertCircle className="size-4 shrink-0" /> {t(lang, error)}
          </p>
        )}

        <div className="mt-4 flex gap-2">
          <Button size="lg" onClick={run} disabled={loading} className="glow flex-1 text-base font-bold">
            {loading ? <><Loader2 className="animate-spin" />{t(lang, "analyzing")}</> : <><ScanSearch />{t(lang, "analyze")}</>}
          </Button>
          {msg && !loading && (
            <Button size="lg" variant="secondary" onClick={() => { setMsg(""); setResult(null); setError(null); }}>
              <X />{t(lang, "clear")}
            </Button>
          )}
        </div>

        <p className="mt-5 mb-2 text-sm text-muted-foreground">{t(lang, "tryExample")}</p>
        <div className="flex flex-wrap gap-2">
          {EXAMPLES.map((ex) => (
            <button
              key={ex.text}
              onClick={() => { setMsg(ex.text); setError(null); setResult(null); }}
              className="rounded-full border border-primary/30 bg-accent/40 px-3 py-1.5 text-sm text-accent-foreground transition hover:bg-accent"
            >
              {ex.label[lang]}
            </button>
          ))}
        </div>
      </div>

      <div aria-live="polite">
        {loading ? (
          <div className="card-elevated flex min-h-80 flex-col items-center justify-center gap-3 p-6 text-muted-foreground">
            <Loader2 className="size-10 animate-spin text-primary" />
            <p>{t(lang, "analyzing")}</p>
          </div>
        ) : result ? (
          <ResultCard result={result} lang={lang} />
        ) : (
          <div className="flex min-h-80 flex-col items-center justify-center gap-3 rounded-2xl border border-dashed p-6 text-center">
            <ShieldQuestion className="size-12 text-primary/60" />
            <p className="font-semibold">{t(lang, "emptyTitle")}</p>
            <p className="max-w-xs text-sm text-muted-foreground">{t(lang, "emptyBody")}</p>
          </div>
        )}
      </div>
    </div>
  );
}
