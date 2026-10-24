import { afterEach, describe, expect, it, vi } from "vitest";
import { conceptSeed, requestImage } from "./image-request";

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("conceptSeed", () => {
  it("is stable across calls and ignores case and padding", () => {
    expect(conceptSeed("Four-slice toaster", 0)).toBe(
      conceptSeed("  four-slice TOASTER ", 0),
    );
  });

  it("differs per concept", () => {
    const seeds = [0, 1, 2].map((index) => conceptSeed("toaster", index));
    expect(new Set(seeds).size).toBe(3);
  });

  it("stays within the range the image route accepts", () => {
    for (const name of ["a", "toaster", "x".repeat(200)]) {
      const seed = conceptSeed(name, 2);
      expect(Number.isInteger(seed)).toBe(true);
      expect(seed).toBeGreaterThanOrEqual(0);
      expect(seed).toBeLessThanOrEqual(2 ** 31 - 1);
    }
  });
});

describe("requestImage", () => {
  const input = { prompt: "A lamp", objectName: "toaster", seed: 1 };

  it("returns the src from the image route", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => Response.json({ src: "https://example.com/a.jpg" })),
    );
    await expect(requestImage(input)).resolves.toBe(
      "https://example.com/a.jpg",
    );
  });

  it.each([
    ["an error status", () => Response.json({}, { status: 502 })],
    ["an unsafe src", () => Response.json({ src: "javascript:alert(1)" })],
  ])("rejects %s", async (_, respond) => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => respond()),
    );
    await expect(requestImage(input)).rejects.toThrow();
  });

  it("gives up on a stalled request", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(
        (_url: string, init: RequestInit) =>
          new Promise((_, reject) => {
            init.signal?.addEventListener("abort", () =>
              reject(init.signal?.reason),
            );
          }),
      ),
    );
    await expect(requestImage(input, undefined, 20)).rejects.toThrow();
  });
});
