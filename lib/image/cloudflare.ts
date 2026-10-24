import "server-only";
import { z } from "zod";
import {
  ImageProviderError,
  ImageRateLimitError,
  ImageTimeoutError,
  type ImageProvider,
} from "./types";

const MODEL = "@cf/black-forest-labs/flux-1-schnell";
const TIMEOUT_MS = 30_000;

const ResponseSchema = z.object({
  result: z.object({ image: z.string().min(1) }),
});

type CloudflareConfig = {
  accountId: string;
  apiToken: string;
  timeoutMs?: number;
};

// flux-1-schnell takes no seed or size, so those options are ignored here.
export function createCloudflareProvider({
  accountId,
  apiToken,
  timeoutMs = TIMEOUT_MS,
}: CloudflareConfig): ImageProvider {
  const url = `https://api.cloudflare.com/client/v4/accounts/${accountId}/ai/run/${MODEL}`;

  return {
    async generate(prompt) {
      const response = await post(url, apiToken, prompt, timeoutMs);
      if (response.status === 429) {
        throw new ImageRateLimitError("Cloudflare Workers AI is rate limited.");
      }
      if (!response.ok) {
        throw new ImageProviderError(
          `Cloudflare Workers AI returned ${response.status}.`,
        );
      }

      const parsed = ResponseSchema.safeParse(
        await response.json().catch(() => null),
      );
      if (!parsed.success) {
        throw new ImageProviderError(
          "Cloudflare Workers AI returned no image.",
        );
      }
      return { src: `data:image/jpeg;base64,${parsed.data.result.image}` };
    },
  };
}

async function post(
  url: string,
  apiToken: string,
  prompt: string,
  timeoutMs: number,
): Promise<Response> {
  const signal = AbortSignal.timeout(timeoutMs);
  try {
    return await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiToken}`,
        "content-type": "application/json",
      },
      body: JSON.stringify({ prompt, steps: 4 }),
      signal,
    });
  } catch (error) {
    if (signal.aborted) {
      throw new ImageTimeoutError("Cloudflare Workers AI timed out.", {
        cause: error,
      });
    }
    throw new ImageProviderError("Could not reach Cloudflare Workers AI.", {
      cause: error,
    });
  }
}
