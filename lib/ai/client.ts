import "server-only";
import { ApiError, GoogleGenAI } from "@google/genai";
import { getEnv } from "@/lib/env";
import type { Analysis } from "@/types/analysis";
import { ANALYZE_REQUEST, SYSTEM_INSTRUCTION } from "./prompt";
import { AnalysisSchema, analysisResponseSchema } from "./schema";

// Shared by both attempts so a fallback cannot push the request past the route's maxDuration.
const TIMEOUT_MS = 45_000;
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

export async function analyzeImage(image: ImageInput): Promise<Analysis> {
  const { GEMINI_MODEL, GEMINI_FALLBACK_MODEL } = getEnv();
  const signal = AbortSignal.timeout(TIMEOUT_MS);

  let text: string | undefined;
  try {
    text = await generate(GEMINI_MODEL, image, signal);
  } catch (error) {
    if (!isRetryable(error) || signal.aborted) {
      throw toClientError(error, signal);
    }
    try {
      text = await generate(GEMINI_FALLBACK_MODEL, image, signal);
    } catch (fallbackError) {
      throw toClientError(fallbackError, signal);
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

function isRetryable(error: unknown): boolean {
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
