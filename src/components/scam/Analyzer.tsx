import { useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Loader2, ScanSearch, X, AlertCircle, ShieldQuestion, ImagePlus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  analyzeMessage,
  validateImage,
  validateMessage,
  EXAMPLES,
  MAX_IMAGE_BYTES,
  MAX_LEN,
  type AnalysisResult,
} from "@/lib/analysis";
import { t, type Lang } from "@/lib/i18n";
import { ResultCard } from "./ResultCard";

interface PickedImage {
  data: string;
  mimeType: string;
  previewUrl: string;
  name: string;
}

function readImage(file: File): Promise<PickedImage> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("read failed"));
    reader.onload = () => {
      const url = String(reader.result);
      const base64 = url.slice(url.indexOf(",") + 1);
      resolve({ data: base64, mimeType: file.type, previewUrl: url, name: file.name });
    };
    reader.readAsDataURL(file);
  });
}

export function Analyzer({ lang }: { lang: Lang }) {
  const analyze = useServerFn(analyzeMessage);
  const [msg, setMsg] = useState("");
  const [image, setImage] = useState<PickedImage | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);

  async function pickImage(file: File | undefined) {
    if (!file) return;
    const v = validateImage(file);
    if (v) return setError(v);
    try {
      setImage(await readImage(file));
      setError(null);
      setResult(null);
    } catch {
      setError("errGeneric");
    }
  }

  function clearAll() {
    setMsg("");
    setImage(null);
    setResult(null);
    setError(null);
    if (fileInput.current) fileInput.current.value = "";
  }

  async function run() {
    if (loading) return;
    if (!image) {
      const v = validateMessage(msg);
      if (v) return setError(v);
    } else if (msg.trim().length > MAX_LEN) {
      return setError("errLong");
    }
    setError(null);
    setLoading(true);
    setResult(null);
    try {
      const req: Parameters<typeof analyze>[0] = { message: msg.trim(), lang };
      if (image) req.image = { data: image.data, mimeType: image.mimeType };
      setResult(await analyze(req));
    } catch (cause) {
      const code = cause instanceof Error ? cause.message : "";
      setError(
        ["errUnavailable", "errQuota", "errTimeout", "errConfiguration", "errImageType", "errImageSize"].includes(code)
          ? code
          : "errGeneric",
      );
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
          disabled={loading}
          maxLength={MAX_LEN + 100}
          onChange={(e) => { setMsg(e.target.value); if (error) setError(null); }}
          placeholder={t(lang, "placeholder")}
          className="min-h-56 resize-y bg-background/60 text-base"
          aria-invalid={!!error}
        />
        <div className="mt-1 text-right text-xs text-muted-foreground" dir="ltr">{msg.length}/{MAX_LEN}</div>

        <div className="mt-3">
          <p className="mb-2 text-sm text-muted-foreground">{t(lang, "orScreenshot")}</p>
          <input
            ref={fileInput}
            type="file"
            accept="image/png,image/jpeg,image/webp"
            className="hidden"
            onChange={(e) => { void pickImage(e.target.files?.[0]); e.target.value = ""; }}
          />
          {image ? (
            <div className="flex items-center gap-3 rounded-xl border bg-background/60 p-3">
              <img src={image.previewUrl} alt={image.name} className="h-16 w-16 rounded-lg object-cover" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium" dir="ltr">{image.name}</p>
                <p className="text-xs text-muted-foreground">{t(lang, "screenshotReady")}</p>
              </div>
              <Button
                size="icon"
                variant="ghost"
                disabled={loading}
                onClick={() => setImage(null)}
                aria-label={t(lang, "removeImage")}
              >
                <Trash2 className="size-4" />
              </Button>
            </div>
          ) : (
            <Button
              variant="outline"
              disabled={loading}
              onClick={() => fileInput.current?.click()}
              className="w-full border-dashed"
            >
              <ImagePlus />{t(lang, "uploadScreenshot")}
            </Button>
          )}
        </div>

        {error && (
          <p role="alert" className="mt-2 flex items-center gap-2 rounded-lg bg-destructive/15 p-3 text-sm text-destructive">
            <AlertCircle className="size-4 shrink-0" /> {t(lang, error)}
          </p>
        )}

        <div className="mt-4 flex gap-2">
          <Button size="lg" onClick={run} disabled={loading} className="glow flex-1 text-base font-bold">
            {loading ? <><Loader2 className="animate-spin" />{t(lang, "analyzing")}</> : <><ScanSearch />{t(lang, "analyze")}</>}
          </Button>
          {(msg || image) && !loading && (
            <Button size="lg" variant="secondary" onClick={clearAll}>
              <X />{t(lang, "clear")}
            </Button>
          )}
        </div>

        <p className="mt-5 mb-2 text-sm text-muted-foreground">{t(lang, "tryExample")}</p>
        <div className="flex flex-wrap gap-2">
          {EXAMPLES.map((ex) => (
            <Button
              key={ex.text}
              variant="outline"
              disabled={loading}
              onClick={() => { setMsg(ex.text); setError(null); setResult(null); }}
              className="rounded-full border border-primary/30 bg-accent/40 px-3 py-1.5 text-sm text-accent-foreground transition hover:bg-accent"
            >
              {ex.label[lang]}
            </Button>
          ))}
        </div>
      </div>

      <div aria-live="polite" aria-busy={loading}>
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
