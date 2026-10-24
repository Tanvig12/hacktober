import { z } from "zod";
import { GatedAnalysisSchema } from "@/lib/ai/schema";
import type { ResizedImage } from "@/lib/resize";
import type { Analysis } from "@/types/analysis";

const ErrorBodySchema = z.object({
  error: z.object({ code: z.string(), message: z.string() }),
});

const MESSAGES: Record<string, string> = {
  invalid_input: "That photo could not be read. Try a different one.",
  invalid_model_output: "The analysis came back incomplete. Try again.",
  rate_limited: "Too many requests right now. Try again in a few seconds.",
  upstream_failure: "The analysis service did not respond. Try again.",
  network: "Could not reach the server. Check your connection and try again.",
  unknown: "Something went wrong. Try again.",
};

export class AnalysisRequestError extends Error {
  name = "AnalysisRequestError";

  constructor(readonly code: string) {
    super(`Analysis request failed: ${code}`);
  }
}

export async function requestAnalysis(photo: ResizedImage): Promise<Analysis> {
  let response: Response;
  try {
    response = await fetch("/api/analyze", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ image: photo.base64, mimeType: photo.mimeType }),
    });
  } catch {
    throw new AnalysisRequestError("network");
  }

  const body: unknown = await response.json().catch(() => null);
  if (!response.ok) {
    const parsed = ErrorBodySchema.safeParse(body);
    throw new AnalysisRequestError(
      parsed.success ? parsed.data.error.code : "unknown",
    );
  }

  const parsed = GatedAnalysisSchema.safeParse(body);
  if (!parsed.success) throw new AnalysisRequestError("invalid_model_output");
  return parsed.data;
}

export function errorMessage(error: unknown): string {
  const code = error instanceof AnalysisRequestError ? error.code : "unknown";
  return MESSAGES[code] ?? MESSAGES.unknown;
}
