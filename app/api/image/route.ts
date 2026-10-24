import { NextResponse } from "next/server";
import { z } from "zod";
import { getImageProvider, IMAGE_SIZE, withSharedStyle } from "@/lib/image";
import {
  ImageProviderError,
  ImageRateLimitError,
  ImageTimeoutError,
} from "@/lib/image/types";

export const maxDuration = 40;

const MAX_SEED = 2 ** 31 - 1;
const SEED_RANGE = `seed must be an integer from 0 to ${MAX_SEED}`;

const RequestSchema = z.object({
  prompt: z
    .string({ error: "prompt is required" })
    .trim()
    .min(1, "prompt is required")
    .max(800, "prompt must be 800 characters or fewer"),
  objectName: z
    .string({ error: "objectName is required" })
    .trim()
    .min(1, "objectName is required")
    .max(200, "objectName must be 200 characters or fewer"),
  seed: z
    .number({ error: SEED_RANGE })
    .int(SEED_RANGE)
    .min(0, SEED_RANGE)
    .max(MAX_SEED, SEED_RANGE),
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

  const { prompt, objectName, seed } = input.data;
  try {
    const image = await getImageProvider().generate(
      withSharedStyle(prompt, objectName),
      { seed, size: IMAGE_SIZE },
    );
    return NextResponse.json({ src: image.src });
  } catch (error) {
    console.error("image generation failed", error);
    return toErrorResponse(error);
  }
}

function toErrorResponse(error: unknown) {
  if (error instanceof ImageRateLimitError) {
    return errorResponse(
      429,
      "rate_limited",
      "Too many image requests right now. Try again in a few seconds.",
    );
  }
  if (
    error instanceof ImageTimeoutError ||
    error instanceof ImageProviderError
  ) {
    return errorResponse(
      502,
      "upstream_failure",
      "The image service is unavailable.",
    );
  }
  return errorResponse(
    500,
    "internal_error",
    "Something went wrong on our side.",
  );
}
