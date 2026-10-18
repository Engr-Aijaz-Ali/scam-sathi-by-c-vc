import { AlertTriangle, CheckCircle2, ShieldAlert, ShieldCheck, Info } from "lucide-react";
import type { AnalysisResult } from "@/lib/analysis";
import { t, type Lang } from "@/lib/i18n";
import { cn } from "@/lib/utils";

const RISK_STYLE = {
  high: { cls: "text-risk-high bg-risk-high/12 border-risk-high/40", Icon: ShieldAlert },
  medium: { cls: "text-risk-medium bg-risk-medium/12 border-risk-medium/40", Icon: AlertTriangle },
  low: { cls: "text-risk-low bg-risk-low/12 border-risk-low/40", Icon: ShieldCheck },
};

export function ResultCard({ result, lang }: { result: AnalysisResult; lang: Lang }) {
  const { cls, Icon } = RISK_STYLE[result.risk];
  return (
    <div className="card-elevated animate-in fade-in slide-in-from-bottom-2 p-5 sm:p-6 space-y-5">
      <div className={cn("flex items-center gap-4 rounded-xl border p-4", cls)}>
        <Icon className="size-10 shrink-0" />
        <div>
          <p className="text-2xl font-bold font-display">{t(lang, `risk_${result.risk}`)}</p>
          <p className="text-sm text-foreground/80">{result.category}</p>
        </div>
      </div>

      <section>
        <h3 className="mb-2 font-semibold">{t(lang, "signs")}</h3>
        {result.warningSigns.length ? (
          <ul className="space-y-2">
            {result.warningSigns.map((s) => (
              <li key={s} className="flex gap-2 text-sm">
                <AlertTriangle className="mt-0.5 size-4 shrink-0 text-risk-medium" /> {s}
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-muted-foreground">{t(lang, "noSigns")}</p>
        )}
      </section>

      <section>
        <h3 className="mb-2 flex items-center gap-2 font-semibold"><Info className="size-4 text-primary" />{t(lang, "explanation")}</h3>
        <p className="text-sm leading-relaxed text-muted-foreground">{result.explanation}</p>
      </section>

      <section>
        <h3 className="mb-2 font-semibold">{t(lang, "actions")}</h3>
        <ul className="space-y-2">
          {result.actions.map((a) => (
            <li key={a} className="flex gap-2 rounded-lg bg-secondary/60 p-3 text-sm">
              <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-primary" /> {a}
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
