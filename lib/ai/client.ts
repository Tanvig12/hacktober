import "server-only";
import { ApiError, GoogleGenAI } from "@google/genai";
import { getEnv } from "@/lib/env";
import type { Analysis } from "@/types/analysis";
import { ANALYZE_REQUEST, SYSTEM_INSTRUCTION } from "./prompt";
import { analysisResponseSchema } from "./gemini-schema";
import { AnalysisSchema } from "./schema";

type Timeouts = { primaryMs: number; totalMs: number };

// An overloaded primary often stalls instead of returning 503, so it gets its own
// shorter budget. The total budget is shared so a fallback cannot push the request
// past the route's maxDuration.
const DEFAULT_TIMEOUTS: Timeouts = { primaryMs: 20_000, totalMs: 45_000 };
const FALLBACK_STATUSES = new Set([429, 503]);

export class RateLimitError extends Error {
  name = "RateLimitError";
}

export class InvalidModelOutputError extends Error {
  name = "InvalidModelOutputError";
}

export class UpstreamError extends Error {
  name = "UpstreamError";
}

export type ImageInput = { base64: string; mimeType: string };

let client: GoogleGenAI | undefined;

function getClient(): GoogleGenAI {
  client ??= new GoogleGenAI({ apiKey: getEnv().GEMINI_API_KEY });
  return client;
}

export async function analyzeImage(
  image: ImageInput,
  timeouts: Timeouts = DEFAULT_TIMEOUTS,
): Promise<Analysis> {
  const { GEMINI_MODEL, GEMINI_FALLBACK_MODEL } = getEnv();
  const total = AbortSignal.timeout(timeouts.totalMs);
  const primary = AbortSignal.any([
    total,
    AbortSignal.timeout(timeouts.primaryMs),
  ]);

  let text: string | undefined;
  try {
    text = await generate(GEMINI_MODEL, image, primary);
  } catch (error) {
    if (total.aborted || !shouldFallBack(error, primary)) {
      throw toClientError(error, total);
    }
    try {
      text = await generate(GEMINI_FALLBACK_MODEL, image, total);
    } catch (fallbackError) {
      throw toClientError(fallbackError, total);
    }
  }
  return parseAnalysis(text);
}

async function generate(
  model: string,
  image: ImageInput,
  signal: AbortSignal,
): Promise<string | undefined> {
  const response = await getClient().models.generateContent({
    model,
    contents: [
      {
        role: "user",
        parts: [
          { inlineData: { mimeType: image.mimeType, data: image.base64 } },
          { text: ANALYZE_REQUEST },
        ],
      },
    ],
    config: {
      systemInstruction: SYSTEM_INSTRUCTION,
      responseMimeType: "application/json",
      responseSchema: analysisResponseSchema,
      abortSignal: signal,
    },
  });
  return response.text;
}

function shouldFallBack(error: unknown, primary: AbortSignal): boolean {
  if (primary.aborted) return true;
  return error instanceof ApiError && FALLBACK_STATUSES.has(error.status);
}

function toClientError(error: unknown, signal: AbortSignal): Error {
  if (signal.aborted) {
    return new UpstreamError("The model did not respond in time.", {
      cause: error,
    });
  }
  if (error instanceof ApiError && error.status === 429) {
    return new RateLimitError("The model is rate limited.", { cause: error });
  }
  return new UpstreamError("The model request failed.", { cause: error });
}

export function parseAnalysis(text: string | undefined): Analysis {
  if (!text) {
    throw new InvalidModelOutputError("The model returned no content.");
  }

  let json: unknown;
  try {
    json = JSON.parse(text);
  } catch (error) {
    throw new InvalidModelOutputError("The model returned malformed JSON.", {
      cause: error,
    });
  }

  const result = AnalysisSchema.safeParse(json);
  if (!result.success) {
    throw new InvalidModelOutputError(
      "The model output did not match the analysis schema.",
      { cause: result.error },
    );
  }
  return result.data;
}
