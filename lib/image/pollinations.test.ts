import { afterEach, describe, expect, it, vi } from "vitest";
import { pollinationsProvider } from "./pollinations";

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("pollinationsProvider", () => {
  it("builds the image URL without fetching it", async () => {
    const fetchSpy = vi.fn();
    vi.stubGlobal("fetch", fetchSpy);

    const { src } = await pollinationsProvider.generate("A tin can lamp", {
      seed: 42,
      size: 768,
    });

    expect(src).toBe(
      "https://image.pollinations.ai/prompt/A%20tin%20can%20lamp?width=768&height=768&nologo=true&seed=42",
    );
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("encodes characters that would break the path", async () => {
    const { src } = await pollinationsProvider.generate("50% off? a/b #1", {
      seed: 1,
      size: 768,
    });
    expect(new URL(src).pathname).toBe("/prompt/50%25%20off%3F%20a%2Fb%20%231");
  });
});
