import { beforeEach, describe, expect, it, vi } from "vitest";

const serverCall = vi.hoisted(() => vi.fn());
vi.mock("@/lib/analysis.functions", () => ({ analyzeMessageFn: serverCall }));
import { analyzeMessage } from "@/lib/analysis";

describe("Live message analysis", () => {
  beforeEach(() => serverCall.mockReset());
  it("returns the real server result instead of keyword output", async () => {
    const result = { risk: "low", category: "Verified context", warningSigns: [], explanation: "Provider response", actions: ["Verify the sender"], isDemo: false };
    serverCall.mockResolvedValue({ ok: true, result });
    const request = { message: "Job offer: pay a registration fee", lang: "en" as const };
    expect(await analyzeMessage(request)).toEqual(result);
    expect(serverCall).toHaveBeenCalledWith({ data: request });
  });
  it("does not substitute a demo when Gemini fails", async () => {
    serverCall.mockResolvedValue({ ok: false, error: "errQuota" });
    await expect(analyzeMessage({ message: "Hello, our meeting is tomorrow", lang: "en" })).rejects.toThrow("errQuota");
  });
});