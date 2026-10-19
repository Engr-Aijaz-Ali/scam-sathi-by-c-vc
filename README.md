# ScamSathi AI

**Your Personal Digital Safety Assistant** — *Think Before You Trust.*

ScamSathi AI checks suspicious messages for scam signs and tells you, in plain words, what to do next. Paste an SMS, WhatsApp message, email, job offer or payment request — or upload a screenshot of one — and get back a risk level, the warning signs found, a simple explanation, and concrete next steps.

Built for everyday users in Pakistan, in **English**, **Roman Urdu** and **Urdu (اردو)**.

> **Disclaimer:** ScamSathi's analysis can be wrong. It is guidance, not a guarantee. When in doubt, contact your bank or the official organisation directly. The app is intentionally key-free for users: there is no login, no subscription and no database.

---

## What it does

| Feature | Details |
| --- | --- |
| **Text / SMS check** | Paste any suspicious message (15–5,000 characters) and press **Analyze Message**. |
| **Screenshot check** | Upload a PNG, JPG or WebP screenshot up to 4 MB. The text inside the image is read and analysed. A short note can be added alongside it. |
| **Scam coverage** | Fake prizes and lotteries, phishing, fake job offers, "task"/earning scams (liking videos, rating apps, commissions), work-from-home schemes, registration or security-deposit fees, advance-fee "unlock your earnings" tricks, Ponzi-style referral apps, payment request fraud, impersonation of banks or government programmes (BISP, Ehsaas, FBR, PTA), and OTP theft. |
| **Result card** | Risk level (**High / Medium / Low**), scam category, bullet-pointed warning signs, a 2–4 sentence explanation, and 3–5 recommended actions including reporting channels (PTA 8484, FIA Cybercrime). |
| **Three languages** | Full UI translation, plus RTL layout and Noto Nastaliq Urdu typography for the Urdu view. Responses come back in the selected language. |
| **Guardrails** | Input validation, loading indicators, `aria-live`/`aria-busy` result region, and friendly translated error messages for every failure mode. |

---

## Tech stack

- **[TanStack Start](https://tanstack.com/start) v1** — full-stack React 19 framework (file-based routing, SSR, server functions)
- **TypeScript**, **Vite**
- **Tailwind CSS v4** — configured in `src/styles.css` with native `@theme` tokens (no `tailwind.config.js`)
- **shadcn/ui** primitives + **lucide-react** icons
- **Vitest** + Testing Library for tests
- **Gemini** for the actual analysis, reached only through a server function

### Design

Dark navy (`oklch(0.17 0.035 255)`) with a teal primary (`oklch(0.78 0.13 185)`), risk colours for high/medium/low, `Sora` for display headings, `Manrope` for body text and `Noto Nastaliq Urdu` for Urdu. Cards, soft glow and a faded grid background give the cybersecurity feel; the layout is mobile-first.

---

## Getting started

You need Node.js and npm.

```sh
git clone <this-repository-url>
cd <repository-name>
npm install
npm run dev
```

Then open the URL printed in your terminal (usually `http://localhost:8080`).

### Scripts

| Command | Purpose |
| --- | --- |
| `npm run dev` | Start the dev server with hot reload |
| `npm run build` | Production build |
| `npm run preview` | Serve the production build locally |
| `npm test` | Run the test suite once |
| `npm run test:watch` | Run tests in watch mode |
| `npm run lint` | ESLint |
| `npm run format` | Prettier |

---

## Configuration

The only secret is the Gemini API key. It is **never** stored in the frontend and never committed.

- **Where it lives:** a project secret named `ScamSathi`, managed in the platform's secret storage (Lovable Cloud). Locally, supply it through your own environment setup.
- **Where it is read:** only inside the server handler in `src/lib/analysis.functions.ts`, via `process.env["ScamSathi"]`. If the secret is missing, the app returns a translated `errConfiguration` message instead of crashing or faking a result.
- **Model:** set by the `GEMINI_MODEL` constant at the top of `src/lib/analysis.functions.ts`.
- **Limits:** `MIN_LEN`, `MAX_LEN`, `MAX_IMAGE_BYTES` and `IMAGE_TYPES` are exported from `src/lib/analysis.ts` and enforced on both the browser and the server.

Nothing else needs to be configured — no accounts, no database, no payment provider.

---

## Architecture

```
Browser                        Server (workerd / edge)                Gemini
───────                        ─────────────────────────                ──────
Analyzer.tsx
  │  analyzeMessage(req)
  ▼
lib/analysis.ts  ──────────►  analysis.functions.ts
(paste / screenshot)          createServerFn(POST)
                                ├─ inputValidator: type, size, length
                                ├─ reads process.env["ScamSathi"]
                                └─ POST generateContent ────────────►  JSON
                                ◄──────── risk, category, warningSigns,
                                            explanation, actions
  ◄───────────  AnalysisResult
ResultCard.tsx
```

- **One entry point.** Every check — typed or screenshotted — goes through `analyzeMessage()` in `src/lib/analysis.ts`, which returns an `AnalysisResult`. The UI never talks to the model directly.
- **Server function.** `analyzeMessageFn` is a `createServerFn` (`POST`) that validates input, builds the prompt, calls Gemini with the key in the `x-goog-api-key` header, and applies a `45s` timeout.
- **Strict response parsing.** The reply must be JSON with `risk` exactly `"high" | "medium" | "low"`, a category, an explanation, warning signs and at least one action. Anything else throws — the app never shows a half-parsed or invented verdict.
- **Typed failures, no fabrication.** Handlers return `{ ok: false, error }` with a code; there is no keyword-based fallback that could look like a real analysis.
- **Translation layer.** All copy lives in `src/lib/i18n.ts` (`en`, `roman`, `ur`); components call `t(lang, key)` and never hardcode strings.

### Error codes

| Code | User sees |
| --- | --- |
| `errEmpty` / `errShort` / `errLong` | Validation hints for the pasted text |
| `errImageType` / `errImageSize` | Unsupported image format or an image over 4 MB |
| `errQuota` | Provider usage limit reached (HTTP 429) |
| `errConfiguration` | Missing key or a rejected request (HTTP 400 / 403) |
| `errTimeout` | The check took too long |
| `errUnavailable` | Provider unreachable or an unusable response |
| `errGeneric` | Anything unexpected |

---

## Project structure

```
src/
├─ routes/
│  ├─ __root.tsx        App shell: fonts, <Toaster />, document head
│  └─ index.tsx         Landing page: hero, language switcher, notices, footer
├─ components/scam/
│  ├─ Analyzer.tsx      Paste area, screenshot upload, examples, loading & error states
│  └─ ResultCard.tsx    Risk banner, warning signs, explanation, actions
├─ lib/
│  ├─ analysis.ts               Shared types, validation, examples, single UI entry point
│  ├─ analysis.functions.ts     Server function: the only place Gemini is contacted
│  ├─ i18n.ts                   en / roman / ur dictionaries
│  └─ utils.ts                  cn() helper
├─ styles.css           Tailwind v4 theme tokens, fonts, card/glow/grid utilities
└─ test/
   ├─ analysis.test.ts          Server delegation and no-fabrication-on-failure
   └─ app-routing.test.tsx      Routing smoke test
```

---

## Testing

```sh
npm test
```

The suite covers the rules that matter: a successful check returns the real server result (not keyword output), and a failed check rejects with its error code rather than substituting a made-up verdict.

Manual checks worth repeating: each example button returns the expected risk level, a screenshot-only upload is analysed on its own, and a dropped connection shows the friendly error and re-enables the button.

---

## Privacy

Personal details (CNIC, account numbers, OTPs) should be removed before pasting. The message is sent over HTTPS to Gemini for analysis only. Nothing is stored — there is no database, and no history is kept.

---

## Deploying

The project runs anywhere a TanStack Start app can be hosted. If it is kept in sync with Lovable, publishing from the editor deploys it, and the `ScamSathi` secret is carried by the platform. Self-hosting means supplying your own Gemini key through your host's secret storage.

---

## Notes

- Gemini occasionally responds slowly; a first attempt can time out and a retry usually succeeds. The app says so instead of leaving the user waiting.
- Reporting numbers shown in the results (PTA **8484**, FIA Cybercrime) should be confirmed against official sources before wider use.
- Contributions are welcome — please keep the branch in a working state and run `npm test` before opening a pull request.
