import { ApiError } from "@google/genai";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { sampleAnalysis as analysis } from "@/test/sample-analysis";

const generateContent = vi.fn();

vi.mock("@google/genai", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@google/genai")>()),
  GoogleGenAI: class {
    models = { generateContent };
  },
}));

vi.mock("@/lib/env", () => ({
  getEnv: () => ({
    GEMINI_API_KEY: "test-key",
    GEMINI_MODEL: "primary",
    GEMINI_FALLBACK_MODEL: "fallback",
  }),
}));

const {
  analyzeImage,
  parseAnalysis,
  InvalidModelOutputError,
  RateLimitError,
  UpstreamError,
} = await import("./client");

const image = { base64: "aGVsbG8=", mimeType: "image/jpeg" };
const ok = { text: JSON.stringify(analysis) };

function apiError(status: number) {
  return new ApiError({ message: `status ${status}`, status });
}

beforeEach(() => {
  generateContent.mockReset();
});

describe("analyzeImage", () => {
  it("returns the parsed analysis from the primary model", async () => {
    generateContent.mockResolvedValueOnce(ok);
    await expect(analyzeImage(image)).resolves.toEqual(analysis);
    expect(generateContent).toHaveBeenCalledTimes(1);
    expect(generateContent.mock.calls[0][0].model).toBe("primary");
  });

  it.each([429, 503])("falls back once on %i", async (status) => {
    generateContent
      .mockRejectedValueOnce(apiError(status))
      .mockResolvedValueOnce(ok);
    await expect(analyzeImage(image)).resolves.toEqual(analysis);
    expect(generateContent.mock.calls.map(([params]) => params.model)).toEqual([
      "primary",
      "fallback",
    ]);
  });

  it("reports a rate limit when the fallback is also limited", async () => {
    generateContent.mockImplementation(async () => {
      throw apiError(429);
    });
    await expect(analyzeImage(image)).rejects.toBeInstanceOf(RateLimitError);
    expect(generateContent).toHaveBeenCalledTimes(2);
  });

  it("does not fall back on other errors", async () => {
    generateContent.mockRejectedValueOnce(apiError(500));
    await expect(analyzeImage(image)).rejects.toBeInstanceOf(UpstreamError);
    expect(generateContent).toHaveBeenCalledTimes(1);
  });

  it("falls back when the primary is too slow", async () => {
    generateContent.mockImplementationOnce(stall).mockResolvedValueOnce(ok);
    const timeouts = { primaryMs: 20, totalMs: 1_000 };

    await expect(analyzeImage(image, timeouts)).resolves.toEqual(analysis);

    const [primaryCall, fallbackCall] = generateContent.mock.calls;
    expect(primaryCall[0].model).toBe("primary");
    expect(fallbackCall[0].model).toBe("fallback");
    expect(fallbackCall[0].config.abortSignal.aborted).toBe(false);
  });

  it("gives up when the total budget runs out during the fallback", async () => {
    generateContent.mockImplementation(stall);
    const timeouts = { primaryMs: 20, totalMs: 60 };

    await expect(analyzeImage(image, timeouts)).rejects.toThrow(
      "The model did not respond in time.",
    );
    expect(generateContent).toHaveBeenCalledTimes(2);
  });
});

type GenerateParams = { config: { abortSignal: AbortSignal } };

// Behaves like an overloaded model: never answers until the request is aborted.
function stall({ config }: GenerateParams): Promise<never> {
  return new Promise((_, reject) => {
    config.abortSignal.addEventListener("abort", () =>
      reject(config.abortSignal.reason),
    );
  });
}

describe("parseAnalysis", () => {
  it.each([
    ["empty output", undefined],
    ["malformed JSON", "{not json"],
    ["a schema mismatch", JSON.stringify({ ...analysis, concepts: [] })],
  ])("rejects %s", (_, text) => {
    expect(() => parseAnalysis(text)).toThrow(InvalidModelOutputError);
  });
});
