import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { ShieldCheck, Lock, Scale } from "lucide-react";
import { Analyzer } from "@/components/scam/Analyzer";
import { LANGS, t, type Lang } from "@/lib/i18n";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "ScamSathi AI — Your Personal Digital Safety Assistant" },
      { name: "description", content: "Paste a suspicious message and ScamSathi checks it for scam signs, in English, Roman Urdu and Urdu." },
      { property: "og:title", content: "ScamSathi AI — Think Before You Trust" },
      { property: "og:description", content: "Check suspicious messages, fake job offers and payment requests for scam signs." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

function Index() {
  const [lang, setLang] = useState<Lang>("en");
  const rtl = lang === "ur";

  return (
    <div lang={rtl ? "ur" : "en"} dir={rtl ? "rtl" : "ltr"} className="relative min-h-screen">
      <div className="grid-bg pointer-events-none absolute inset-x-0 top-0 h-[480px]" />
      <header className="relative mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-5">
        <div className="flex items-center gap-2" dir="ltr">
          <div className="grid size-9 place-items-center rounded-xl bg-primary text-primary-foreground glow">
            <ShieldCheck className="size-5" />
          </div>
          <span className="font-display text-lg font-bold">ScamSathi <span className="text-primary">AI</span></span>
        </div>
        <div role="group" aria-label="Language" className="flex rounded-full border bg-surface p-1">
          {LANGS.map((l) => (
            <button
              key={l.id}
              onClick={() => setLang(l.id)}
              aria-pressed={lang === l.id}
              className={cn(
                "rounded-full px-3 py-1 text-sm transition",
                lang === l.id ? "bg-primary text-primary-foreground font-semibold" : "text-muted-foreground hover:text-foreground",
              )}
            >
              {l.label}
            </button>
          ))}
        </div>
      </header>

      <main className="relative mx-auto max-w-6xl px-4 pb-16">
        <section className="mx-auto max-w-3xl py-10 text-center sm:py-16">
          <span className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-accent/40 px-3 py-1 text-xs font-semibold text-accent-foreground">
            <span className="size-1.5 rounded-full bg-primary" /> {t(lang, "badge")}
          </span>
          <h1 className="mt-5 text-4xl font-extrabold tracking-tight sm:text-6xl">{t(lang, "headline")}</h1>
          <p className="mt-5 text-base text-muted-foreground sm:text-lg">{t(lang, "sub")}</p>
        </section>

        <Analyzer lang={lang} />

        <section className="mt-10 grid gap-4 sm:grid-cols-2">
          <Notice icon={<Lock className="size-5" />} title={t(lang, "privacyTitle")} body={t(lang, "privacy")} />
          <Notice icon={<Scale className="size-5" />} title={t(lang, "disclaimerTitle")} body={t(lang, "disclaimer")} />
        </section>
      </main>

      <footer className="border-t py-6 text-center text-sm text-muted-foreground">
        ScamSathi AI · {t(lang, "footer")}
      </footer>
    </div>
  );
}

function Notice({ icon, title, body }: { icon: React.ReactNode; title: string; body: string }) {
  return (
    <div className="card-elevated flex gap-3 p-5">
      <div className="text-primary">{icon}</div>
      <div>
        <p className="font-semibold">{title}</p>
        <p className="mt-1 text-sm text-muted-foreground">{body}</p>
      </div>
    </div>
  );
}
