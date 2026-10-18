import { analyzeMessageFn } from "./analysis.functions";
import type { Lang } from "./i18n";

export type RiskLevel = "high" | "medium" | "low";

/** Shape every analyzer (demo or live AI) must return. */
export interface AnalysisResult {
  risk: RiskLevel;
  category: string;
  warningSigns: string[];
  explanation: string;
  actions: string[];
  isDemo: boolean;
}

export interface AnalysisRequest {
  message: string;
  lang: Lang;
}

export const MIN_LEN = 15;
export const MAX_LEN = 5000;

export function validateMessage(msg: string): "errEmpty" | "errShort" | "errLong" | null {
  const m = msg.trim();
  if (!m) return "errEmpty";
  if (m.length < MIN_LEN) return "errShort";
  if (m.length > MAX_LEN) return "errLong";
  return null;
}

/** Single UI entry point; only the server function contacts Gemini. */
export async function analyzeMessage(req: AnalysisRequest): Promise<AnalysisResult> {
  const response = await analyzeMessageFn({ data: req });
  if (!response.ok) throw new Error(response.error);
  return response.result;
}

export const EXAMPLES: { label: Record<Lang, string>; text: string }[] = [
  { label: { en: "Prize message", roman: "Inaam message", ur: "انعامی پیغام" },
    text: "Congratulations! Your number has won Rs. 50,000 in the Jeeto Pakistan lucky draw. To claim, send your CNIC and pay Rs. 500 processing fee via JazzCash to 0300-1234567 within 24 hours." },
  { label: { en: "Fake job", roman: "Jaali job", ur: "جعلی نوکری" },
    text: "Work from home part-time job! Earn Rs. 3000 daily just by liking YouTube videos. Pay Rs. 1000 registration fee to start today. Limited seats, reply urgent." },
  { label: { en: "Bank OTP", roman: "Bank OTP", ur: "بینک او ٹی پی" },
    text: "Dear customer, your bank account will be blocked today. Verify immediately at http://secure-bank-verify.xyz and share the OTP code you receive." },
  { label: { en: "Normal text", roman: "Aam message", ur: "عام پیغام" },
    text: "Hi Ali, the meeting has moved to 4pm tomorrow at the office. See you there." },
];
