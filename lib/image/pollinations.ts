import "server-only";
import {
  ImageProviderError,
  ImageRateLimitError,
  ImageTimeoutError,
  type ImageProvider,
} from "./types";

// Anonymous Pollinations allows about one image per 45 s. Within this budget the
// provider waits out the limit once instead of failing straight away.
const BUDGET_MS = 80_000;
const DEFAULT_RETRY_AFTER_S = 45;
const RETRYABLE_STATUSES = new Set([402, 429, 503]);

export function pollinationsUrl(
  prompt: string,
  { seed, size }: { seed: number; size: number },
): string {
  const params = new URLSearchParams({
    width: String(size),
    height: String(size),
    nologo: "true",
    seed: String(seed),
  });
  return `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?${params}`;
}

function retryAfterMs(response: Response): number {
  const seconds = Number(response.headers.get("retry-after"));
  return (
    (Number.isFinite(seconds) && seconds >= 0
      ? seconds
      : DEFAULT_RETRY_AFTER_S) * 1000
  );
}

// The image is fetched on the server: over the limit, a browser is served a
// "limit reached" banner as an ordinary image, which the page cannot tell apart.
export function createPollinationsProvider(
  budgetMs = BUDGET_MS,
): ImageProvider {
  return {
    async generate(prompt, opts) {
      const url = pollinationsUrl(prompt, opts);
      const deadline = Date.now() + budgetMs;

      for (;;) {
        const response = await fetchBefore(url, deadline);
        const type = response.headers.get("content-type") ?? "";
        if (response.ok && type.startsWith("image/")) {
          const data = Buffer.from(await response.arrayBuffer()).toString(
            "base64",
          );
          return { src: `data:${type.split(";")[0]};base64,${data}` };
        }
        if (!RETRYABLE_STATUSES.has(response.status)) {
          throw new ImageProviderError(
            `Pollinations returned ${response.status}.`,
          );
        }
        const wait = retryAfterMs(response);
        if (Date.now() + wait >= deadline) {
          throw new ImageRateLimitError("Pollinations is rate limited.");
        }
        await new Promise((resolve) => setTimeout(resolve, wait));
      }
    },
  };
}

async function fetchBefore(url: string, deadline: number): Promise<Response> {
  const signal = AbortSignal.timeout(Math.max(1, deadline - Date.now()));
  try {
    return await fetch(url, { signal });
  } catch (error) {
    if (signal.aborted) {
      throw new ImageTimeoutError("Pollinations timed out.", { cause: error });
    }
    throw new ImageProviderError("Could not reach Pollinations.", {
      cause: error,
    });
  }
}
