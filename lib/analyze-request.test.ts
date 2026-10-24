import { afterEach, describe, expect, it, vi } from "vitest";
import type { ResizedImage } from "@/lib/resize";
import {
  AnalysisRequestError,
  errorMessage,
  requestAnalysis,
} from "./analyze-request";

const photo: ResizedImage = {
  base64: "aGVsbG8=",
  mimeType: "image/jpeg",
  width: 10,
  height: 10,
};

function respond(status: number, body: unknown) {
  vi.stubGlobal(
    "fetch",
    vi.fn(async () => Response.json(body, { status })),
  );
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("requestAnalysis", () => {
  it("surfaces the API error code", async () => {
    respond(429, { error: { code: "rate_limited", message: "slow down" } });
    const error = await requestAnalysis(photo).catch((e: unknown) => e);
    expect(error).toBeInstanceOf(AnalysisRequestError);
    expect(errorMessage(error)).toBe(
      "Too many requests right now. Try again in a few seconds.",
    );
  });

  it("treats a malformed success body as invalid output", async () => {
    respond(200, { object_name: "Toaster" });
    await expect(requestAnalysis(photo)).rejects.toMatchObject({
      code: "invalid_model_output",
    });
  });

  it("reports a network failure", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => {
        throw new TypeError("Failed to fetch");
      }),
    );
    await expect(requestAnalysis(photo)).rejects.toMatchObject({
      code: "network",
    });
  });
});

describe("errorMessage", () => {
  it("falls back to a generic message for unknown codes", () => {
    expect(errorMessage(new AnalysisRequestError("teapot"))).toBe(
      "Something went wrong. Try again.",
    );
    expect(errorMessage(new Error("boom"))).toBe(
      "Something went wrong. Try again.",
    );
  });
});
