export type ImageOptions = { seed: number; size: number };

export interface ImageProvider {
  generate(prompt: string, opts: ImageOptions): Promise<{ src: string }>;
}

export class ImageRateLimitError extends Error {
  name = "ImageRateLimitError";
}

export class ImageTimeoutError extends Error {
  name = "ImageTimeoutError";
}

export class ImageProviderError extends Error {
  name = "ImageProviderError";
}
