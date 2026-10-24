import { z } from "zod";

const ImageResponseSchema = z.object({
  src: z
    .string()
    .refine(
      (src) => src.startsWith("https://") || src.startsWith("data:image/"),
      "src must be an https or image data URL",
    ),
});

export type ImageRequest = { prompt: string; objectName: string; seed: number };

// Slightly above the image route's maxDuration, so a stalled request still ends in the fallback.
const REQUEST_TIMEOUT_MS = 95_000;

export async function requestImage(
  input: ImageRequest,
  signal?: AbortSignal,
  timeoutMs = REQUEST_TIMEOUT_MS,
): Promise<string> {
  const timeout = AbortSignal.timeout(timeoutMs);
  const response = await fetch("/api/image", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(input),
    signal: signal ? AbortSignal.any([signal, timeout]) : timeout,
  });
  if (!response.ok) {
    throw new Error(`Image request failed with status ${response.status}.`);
  }
  const parsed = ImageResponseSchema.safeParse(await response.json());
  if (!parsed.success) throw new Error("Image response was malformed.");
  return parsed.data.src;
}

// FNV-1a: a stable hash, so the same object and concept always get the same image.
export function conceptSeed(objectName: string, index: number): number {
  const key = `${objectName.trim().toLowerCase()}:${index}`;
  let hash = 0x811c9dc5;
  for (let i = 0; i < key.length; i++) {
    hash ^= key.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return (hash >>> 0) & 0x7fffffff;
}
