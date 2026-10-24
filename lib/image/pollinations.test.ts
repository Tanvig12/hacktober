import { afterEach, describe, expect, it, vi } from "vitest";
import { createPollinationsProvider, pollinationsUrl } from "./pollinations";
import { ImageProviderError, ImageRateLimitError } from "./types";

const options = { seed: 42, size: 768 };

function jpeg(): Response {
  return new Response(new Uint8Array([0xff, 0xd8, 0xff]), {
    headers: { "content-type": "image/jpeg" },
  });
}

function limited(retryAfter: string): Response {
  return Response.json(
    { error: "limit" },
    { status: 402, headers: { "retry-after": retryAfter } },
  );
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("pollinationsUrl", () => {
  it("builds the image URL", () => {
    expect(pollinationsUrl("A tin can lamp", options)).toBe(
      "https://image.pollinations.ai/prompt/A%20tin%20can%20lamp?width=768&height=768&nologo=true&seed=42",
    );
  });

  it("encodes characters that would break the path", () => {
    const src = pollinationsUrl("50% off? a/b #1", options);
    expect(new URL(src).pathname).toBe("/prompt/50%25%20off%3F%20a%2Fb%20%231");
  });
});

describe("createPollinationsProvider", () => {
  it("returns the fetched image as a data URL", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => jpeg()),
    );
    const { src } = await createPollinationsProvider().generate("x", options);
    expect(src).toBe("data:image/jpeg;base64,/9j/");
  });

  it("waits out the rate limit and tries again", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(limited("0"))
      .mockResolvedValueOnce(jpeg());
    vi.stubGlobal("fetch", fetchMock);

    const { src } = await createPollinationsProvider().generate("x", options);

    expect(src).toMatch(/^data:image\/jpeg;base64,/);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("gives up when the wait would exceed its budget", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => limited("60")),
    );
    await expect(
      createPollinationsProvider(1_000).generate("x", options),
    ).rejects.toBeInstanceOf(ImageRateLimitError);
  });

  it.each([
    ["an error status", () => new Response(null, { status: 500 })],
    ["a non-image body", () => Response.json({ ok: true })],
  ])("rejects %s", async (_, respond) => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => respond()),
    );
    await expect(
      createPollinationsProvider().generate("x", options),
    ).rejects.toBeInstanceOf(ImageProviderError);
  });
});
