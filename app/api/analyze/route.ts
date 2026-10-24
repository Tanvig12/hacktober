import { NextResponse } from "next/server";
import { z } from "zod";
import {
  analyzeImage,
  InvalidModelOutputError,
  RateLimitError,
  UpstreamError,
} from "@/lib/ai/client";
import { enforceSafety } from "@/lib/safety";

export const maxDuration = 60;

const MAX_IMAGE_BYTES = 4 * 1024 * 1024;

function decodedSize(base64: string): number {
  const padding = base64.endsWith("==") ? 2 : base64.endsWith("=") ? 1 : 0;
  return (base64.length * 3) / 4 - padding;
}

const RequestSchema = z.object({
  image: z
    .base64("image must be base64 without a data URL prefix")
    .min(1, "image is required")
    .refine(
      (value) => decodedSize(value) < MAX_IMAGE_BYTES,
      "image must be under 4 MB",
    ),
  mimeType: z.enum(["image/jpeg", "image/png", "image/webp"], {
    error: "mimeType must be image/jpeg, image/png or image/webp",
  }),
});

function errorResponse(status: number, code: string, message: string) {
  return NextResponse.json({ error: { code, message } }, { status });
}

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return errorResponse(400, "invalid_input", "Request body must be JSON.");
  }

  const input = RequestSchema.safeParse(body);
  if (!input.success) {
    const message = input.error.issues[0]?.message ?? "Invalid request.";
    return errorResponse(400, "invalid_input", message);
  }

  try {
    const analysis = await analyzeImage({
      base64: input.data.image,
      mimeType: input.data.mimeType,
    });
    return NextResponse.json(enforceSafety(analysis));
  } catch (error) {
    console.error("analyze failed", error);
    return toErrorResponse(error);
  }
}

function toErrorResponse(error: unknown) {
  if (error instanceof RateLimitError) {
    return errorResponse(
      429,
      "rate_limited",
      "Too many requests right now. Try again in a minute.",
    );
  }
  if (error instanceof InvalidModelOutputError) {
    return errorResponse(
      422,
      "invalid_model_output",
      "The analysis came back incomplete. Try again.",
    );
  }
  if (error instanceof UpstreamError) {
    return errorResponse(
      502,
      "upstream_failure",
      "The analysis service is unavailable. Try again.",
    );
  }
  return errorResponse(
    500,
    "internal_error",
    "Something went wrong on our side. Try again.",
  );
}
