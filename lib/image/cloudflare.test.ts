import { afterEach, describe, expect, it, vi } from "vitest";
import { createCloudflareProvider } from "./cloudflare";
import {
  ImageProviderError,
  ImageRateLimitError,
  ImageTimeoutError,
} from "./types";

const options = { seed: 1, size: 768 };

function stubFetch(implementation: (init: RequestInit) => Promise<Response>) {
  const fetchMock = vi.fn((_url: string, init: RequestInit) =>
    implementation(init),
  );
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

function provider(timeoutMs?: number) {
  return createCloudflareProvider({
    accountId: "acct",
    apiToken: "token",
    timeoutMs,
  });
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("createCloudflareProvider", () => {
  it("posts the prompt and returns a JPEG data URL", async () => {
    const fetchMock = stubFetch(async () =>
      Response.json({ result: { image: "aGVsbG8=" }, success: true }),
    );

    const { src } = await provider().generate("A lamp", options);

    expect(src).toBe("data:image/jpeg;base64,aGVsbG8=");
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe(
      "https://api.cloudflare.com/client/v4/accounts/acct/ai/run/@cf/black-forest-labs/flux-1-schnell",
    );
    expect(init.method).toBe("POST");
    expect(init.headers).toMatchObject({ Authorization: "Bearer token" });
    expect(JSON.parse(String(init.body))).toEqual({
      prompt: "A lamp",
      steps: 4,
    });
  });

  it("reports a rate limit", async () => {
    stubFetch(async () => new Response(null, { status: 429 }));
    await expect(provider().generate("x", options)).rejects.toBeInstanceOf(
      ImageRateLimitError,
    );
  });

  it.each([
    ["an error status", () => new Response(null, { status: 500 })],
    ["a body without an image", () => Response.json({ result: {} })],
    ["a non-JSON body", () => new Response("<html>")],
  ])("rejects %s", async (_, respond) => {
    stubFetch(async () => respond());
    await expect(provider().generate("x", options)).rejects.toBeInstanceOf(
      ImageProviderError,
    );
  });

  it("times out a stalled request", async () => {
    stubFetch(
      (init) =>
        new Promise((_, reject) => {
          init.signal?.addEventListener("abort", () =>
            reject(init.signal?.reason),
          );
        }),
    );
    await expect(provider(20).generate("x", options)).rejects.toBeInstanceOf(
      ImageTimeoutError,
    );
  });
});
