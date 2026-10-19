import { createServerFn } from "@tanstack/react-start";
import type { AnalysisRequest, AnalysisResult, RiskLevel } from "./analysis";
import { IMAGE_TYPES, MAX_IMAGE_BYTES, MAX_LEN, MIN_LEN } from "./analysis";

const GEMINI_MODEL = "gemini-3-flash-preview";const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;

const LANG_NAME: Record<AnalysisRequest["lang"], string> = {
  en: "English",
  roman: "Roman Urdu (Urdu written in Latin script)",
  ur: "Urdu (اردو script)",
};

const SYSTEM_PROMPT = `You are ScamSathi, a digital safety assistant for people in Pakistan. Analyze messages for scams: fake prizes/lotteries, phishing, fake job offers, payment request fraud, impersonation of banks or government programs (BISP, Ehsaas, FBR, PTA, banks), OTP theft, and suspicious links.

Pay special attention to job and earning scams: fake job offers or internships, "task" scams (liking videos, rating apps, completing orders for commission), work-from-home schemes promising easy daily income, demands for registration/training/security-deposit fees, advance-fee "unlock your earnings" tricks, and Ponzi-style referral earning apps. Real employers never ask candidates to pay money.

The input may be pasted text, a screenshot image of a message, or both. For a screenshot, read the visible text in the image and analyze that content.

Respond ONLY with a JSON object of this exact shape:
{
  "risk": "high" | "medium" | "low",
  "category": "short category name, e.g. Prize Scam, Phishing, Fake Job Offer, Task/Earning Scam, Payment Request Scam, Impersonation, OTP Theft, or 'No obvious scam pattern'",
  "warningSigns": ["short bullet points of specific red flags found; empty array if none"],
  "explanation": "2-4 sentences in simple words explaining what this message is and why it is risky or safe",
  "actions": ["3-5 concrete next steps, e.g. don't reply, never share OTP/CNIC, never pay any fee for a job, block and report to PTA 8484 / FIA Cybercrime, verify via official channel"]
}

Rules: risk must be exactly "high", "medium" or "low". Be concise. Never ask follow-up questions. Write ALL text fields in the requested language.`;

interface GeminiResponse {
  candidates?: { content?: { parts?: { text?: string }[] } }[];
  error?: { message?: string };
}

function extractJson(text: string): Omit<AnalysisResult, "isDemo"> {
  const cleaned = text.replace(/```(?:json)?/gi, "").trim();
  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");
  if (start === -1 || end === -1) throw new Error("No JSON in Gemini response");
  const parsed = JSON.parse(cleaned.slice(start, end + 1)) as Record<string, unknown>;

  const rawRisk = parsed["risk"];
  if (rawRisk !== "high" && rawRisk !== "medium" && rawRisk !== "low") throw new Error("Invalid risk");
  const risk: RiskLevel = rawRisk;

  const str = (v: unknown, fallback: string) => (typeof v === "string" && v.trim() ? v.trim() : fallback);
  const strArr = (v: unknown) =>
    Array.isArray(v) ? v.filter((x): x is string => typeof x === "string" && !!x.trim()).map((x) => x.trim()) : [];

  if (typeof parsed["category"] !== "string" || !parsed["category"].trim() ||
      typeof parsed["explanation"] !== "string" || !parsed["explanation"].trim() ||
      !Array.isArray(parsed["warningSigns"]) || !parsed["warningSigns"].every((s) => typeof s === "string" && s.trim()) ||
      !Array.isArray(parsed["actions"]) || parsed["actions"].length === 0 || !parsed["actions"].every((s) => typeof s === "string" && s.trim())) {
    throw new Error("Invalid AI response");
  }
  return {
    risk,
    category: str(parsed["category"], "Analysis"),
    warningSigns: strArr(parsed["warningSigns"]),
    explanation: str(parsed["explanation"], "The message could not be fully analyzed."),
    actions: strArr(parsed["actions"]),
  };
}

export const analyzeMessageFn = createServerFn({ method: "POST" })
  .inputValidator((data: AnalysisRequest): AnalysisRequest => {
    const msg = (data?.message ?? "").trim();
    const img = data?.image;
    const hasImage = !!img && typeof img.data === "string" && !!img.data;
    if (hasImage) {
      if (!IMAGE_TYPES.includes(img!.mimeType)) throw new Error("errImageType");
      // base64 inflates size by ~4/3
      if (img!.data.length > (MAX_IMAGE_BYTES * 4) / 3 + 16) throw new Error("errImageSize");
      if (msg.length > MAX_LEN) throw new Error("Invalid message length");
    } else if (msg.length < MIN_LEN || msg.length > MAX_LEN) {
      throw new Error("Invalid message length");
    }
    const lang = data?.lang === "roman" || data?.lang === "ur" ? data.lang : "en";
    const req: AnalysisRequest = { message: msg, lang };
    if (hasImage) req.image = { data: img!.data, mimeType: img!.mimeType };
    return req;
  })
  .handler(async ({ data }): Promise<{ ok: true; result: AnalysisResult } | { ok: false; error: string }> => {
    const apiKey = process.env["ScamSathi"];
    if (!apiKey) return { ok: false, error: "errConfiguration" };

    const parts: Record<string, unknown>[] = [];
    if (data.image) {
      parts.push({ inlineData: { mimeType: data.image.mimeType, data: data.image.data } });
    }
    const prompt = data.message
      ? `Reply entirely in ${LANG_NAME[data.lang]}. Analyze this message${data.image ? " (screenshot attached; the user also wrote a note)" : ""}:\n\n"""\n${data.message}\n"""`
      : `Reply entirely in ${LANG_NAME[data.lang]}. Read the text visible in this screenshot and analyze it for scam signs.`;
    parts.push({ text: prompt });

    try {
      const res = await fetch(GEMINI_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-goog-api-key": apiKey },
        signal: AbortSignal.timeout(45000),
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
          contents: [{ role: "user", parts }],
          generationConfig: { temperature: 0.2, maxOutputTokens: 2048, responseMimeType: "application/json" },
        }),
      });

      const body = (await res.json().catch(() => null)) as GeminiResponse | null;
      if (!res.ok) {
        console.error("Gemini analysis request failed", { status: res.status });
        return { ok: false, error: res.status === 429 ? "errQuota" : res.status === 400 || res.status === 403 ? "errConfiguration" : "errUnavailable" };
      }

      const text = body?.candidates?.[0]?.content?.parts?.map((p) => p.text ?? "").join("") ?? "";
      if (!text) throw new Error("Empty AI response");

      return { ok: true, result: { ...extractJson(text), isDemo: false } };
    } catch (error) {
      const timedOut = error instanceof Error && (error.name === "TimeoutError" || error.name === "AbortError");
      console.error("Gemini analysis failed", { reason: timedOut ? "timeout" : "connection-or-response" });
      return { ok: false, error: timedOut ? "errTimeout" : "errUnavailable" };
    }
  });
