import "server-only";
import { getEnv } from "@/lib/env";
import { createCloudflareProvider } from "./cloudflare";
import { createPollinationsProvider } from "./pollinations";
import type { ImageProvider } from "./types";

export const IMAGE_SIZE = 768;

export function getImageProvider(): ImageProvider {
  const { IMAGE_PROVIDER, CF_ACCOUNT_ID, CF_API_TOKEN } = getEnv();
  if (IMAGE_PROVIDER !== "cloudflare") return createPollinationsProvider();
  if (!CF_ACCOUNT_ID || !CF_API_TOKEN) {
    throw new Error("Cloudflare credentials are missing.");
  }
  return createCloudflareProvider({
    accountId: CF_ACCOUNT_ID,
    apiToken: CF_API_TOKEN,
  });
}

// One shared style so the three concept images read as a set.
export function withSharedStyle(prompt: string, objectName: string): string {
  return `${prompt.trim()} Style: product photograph of an object made from a reused ${objectName.trim()}, soft daylight, plain neutral background, no text, no people, no logos.`;
}
