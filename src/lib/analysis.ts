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

/**
 * Single entry point used by the UI. To go live, replace the body with a call
 * to a server function (createServerFn) that talks to the AI model; keep the
 * same AnalysisResult shape and set isDemo: false.
 */
export async function analyzeMessage(req: AnalysisRequest): Promise<AnalysisResult> {
  await new Promise((r) => setTimeout(r, 900));
  return demoAnalyze(req);
}

type Rule = { re: RegExp; sign: Record<Lang, string>; weight: number; cat: string };

const RULES: Rule[] = [
  { re: /(won|winner|prize|lottery|jeet|inaam|انعام|congratulations|mubarak)/i, weight: 3, cat: "prize",
    sign: { en: "Claims you won a prize or lottery", roman: "Inaam ya lottery jeetne ka dawa", ur: "انعام یا لاٹری جیتنے کا دعویٰ" } },
  { re: /(fee|pay|send.*(rs|pkr|money)|jazzcash|easypaisa|advance|deposit|ada kar|فیس)/i, weight: 3, cat: "payment",
    sign: { en: "Asks you to pay money or a fee upfront", roman: "Pehle paisay ya fee mangi ja rahi hai", ur: "پہلے پیسے یا فیس مانگی جا رہی ہے" } },
  { re: /(otp|pin|password|cnic|cvv|code|شناختی|pin code)/i, weight: 4, cat: "phishing",
    sign: { en: "Asks for OTP, PIN, password or CNIC", roman: "OTP, PIN, password ya CNIC mang raha hai", ur: "او ٹی پی، پن، پاس ورڈ یا شناختی کارڈ مانگا جا رہا ہے" } },
  { re: /(urgent|immediately|within \d+|today only|jaldi|foran|blocked|suspend|فوراً)/i, weight: 2, cat: "phishing",
    sign: { en: "Creates urgency or pressure", roman: "Jaldi karne ka dabao daala ja raha hai", ur: "جلدی کرنے کا دباؤ ڈالا جا رہا ہے" } },
  { re: /(https?:\/\/|bit\.ly|tinyurl|\.xyz|\.top|click)/i, weight: 2, cat: "phishing",
    sign: { en: "Contains a link to click", roman: "Click karne ke liye link diya gaya hai", ur: "کلک کرنے کے لیے لنک دیا گیا ہے" } },
  { re: /(job|salary|work from home|ghar baithe|part.?time|earn|naukri|نوکری)/i, weight: 2, cat: "job",
    sign: { en: "Too-good-to-be-true job or earning offer", roman: "Hadd se zyada achhi job ya kamai ki offer", ur: "حد سے زیادہ اچھی نوکری یا کمائی کی پیشکش" } },
  { re: /(bisp|benazir|ehsaas|govt|government|hukumat)/i, weight: 2, cat: "impersonation",
    sign: { en: "Claims to be from a government program", roman: "Hukumati program ke naam se message", ur: "سرکاری پروگرام کے نام سے پیغام" } },
];

const CATS: Record<string, Record<Lang, string>> = {
  prize: { en: "Prize / Lottery Scam", roman: "Inaam / Lottery Scam", ur: "انعام / لاٹری دھوکہ" },
  payment: { en: "Payment Request Scam", roman: "Payment Request Scam", ur: "ادائیگی کا دھوکہ" },
  phishing: { en: "Phishing Attempt", roman: "Phishing Koshish", ur: "فشنگ کی کوشش" },
  job: { en: "Fake Job Offer", roman: "Jaali Job Offer", ur: "جعلی نوکری کی پیشکش" },
  impersonation: { en: "Impersonation Scam", roman: "Naqli Idara Scam", ur: "جعلی ادارہ دھوکہ" },
  none: { en: "No obvious scam pattern", roman: "Koi wazeh scam pattern nahi", ur: "کوئی واضح دھوکہ نہیں" },
};

const EXPL: Record<RiskLevel, Record<Lang, string>> = {
  high: {
    en: "This message shows several classic scam patterns. Real companies, banks and government programs do not ask for fees, OTPs or personal details like this.",
    roman: "Is message mein kai aam scam nishaniyan hain. Asli companies, bank aur hukumati idaray is tarah fee, OTP ya zaati maloomat nahi mangte.",
    ur: "اس پیغام میں دھوکے کی کئی عام نشانیاں ہیں۔ اصل کمپنیاں، بینک اور سرکاری ادارے اس طرح فیس، او ٹی پی یا ذاتی معلومات نہیں مانگتے۔",
  },
  medium: {
    en: "Some parts of this message look suspicious. It may be genuine, but verify it through an official source before acting.",
    roman: "Is message ke kuch hissay mashkook hain. Ho sakta hai asli ho, lekin kuch karne se pehle official zariye se tasdeeq karein.",
    ur: "اس پیغام کے کچھ حصے مشکوک ہیں۔ ہو سکتا ہے اصلی ہو، لیکن کچھ کرنے سے پہلے سرکاری ذریعے سے تصدیق کریں۔",
  },
  low: {
    en: "No common scam signs were detected. Still, stay careful and never share passwords or OTPs.",
    roman: "Koi aam scam nishani nahi mili. Phir bhi ehtiyat karein aur kabhi password ya OTP share na karein.",
    ur: "کوئی عام دھوکے کی نشانی نہیں ملی۔ پھر بھی احتیاط کریں اور کبھی پاس ورڈ یا او ٹی پی شیئر نہ کریں۔",
  },
};

const ACTIONS: Record<RiskLevel, Record<Lang, string[]>> = {
  high: {
    en: ["Do not reply, click links, or send money.", "Never share OTP, PIN or CNIC.", "Block the sender and report it (PTA: 8484 / FIA Cybercrime).", "Warn family and friends about this message."],
    roman: ["Jawab na dein, link na kholein, paisay na bhejein.", "OTP, PIN ya CNIC kabhi share na karein.", "Sender ko block karein aur report karein (PTA: 8484 / FIA Cybercrime).", "Ghar walon aur doston ko is message se aagah karein."],
    ur: ["جواب نہ دیں، لنک نہ کھولیں، پیسے نہ بھیجیں۔", "او ٹی پی، پن یا شناختی کارڈ کبھی شیئر نہ کریں۔", "بھیجنے والے کو بلاک کریں اور رپورٹ کریں (پی ٹی اے: 8484 / ایف آئی اے سائبر کرائم)۔", "گھر والوں اور دوستوں کو اس پیغام سے آگاہ کریں۔"],
  },
  medium: {
    en: ["Don't act in a hurry.", "Contact the organization using its official number or website.", "Avoid clicking links in the message."],
    roman: ["Jaldi mein koi qadam na uthayein.", "Idaray se unke official number ya website se rabta karein.", "Message ke links par click na karein."],
    ur: ["جلدی میں کوئی قدم نہ اٹھائیں۔", "ادارے سے اس کے سرکاری نمبر یا ویب سائٹ سے رابطہ کریں۔", "پیغام کے لنکس پر کلک نہ کریں۔"],
  },
  low: {
    en: ["Stay cautious with unknown senders.", "Verify anything that involves money."],
    roman: ["Anjaan logon se ehtiyat rakhein.", "Paison wali har baat ki tasdeeq karein."],
    ur: ["انجان لوگوں سے احتیاط رکھیں۔", "پیسوں والی ہر بات کی تصدیق کریں۔"],
  },
};

export function demoAnalyze({ message, lang }: AnalysisRequest): AnalysisResult {
  const hits = RULES.filter((r) => r.re.test(message));
  const score = hits.reduce((s, r) => s + r.weight, 0);
  const risk: RiskLevel = score >= 5 ? "high" : score >= 2 ? "medium" : "low";
  const top = [...hits].sort((a, b) => b.weight - a.weight)[0];
  return {
    risk,
    category: CATS[top?.cat ?? "none"][lang],
    warningSigns: hits.map((h) => h.sign[lang]),
    explanation: EXPL[risk][lang],
    actions: ACTIONS[risk][lang],
    isDemo: true,
  };
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
