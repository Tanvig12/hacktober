import type { ImageProvider } from "./types";

// The browser fetches this URL itself, so the server never waits on generation.
export const pollinationsProvider: ImageProvider = {
  async generate(prompt, { seed, size }) {
    const params = new URLSearchParams({
      width: String(size),
      height: String(size),
      nologo: "true",
      seed: String(seed),
    });
    return {
      src: `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?${params}`,
    };
  },
};
