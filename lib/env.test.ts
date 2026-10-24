import { describe, expect, it } from "vitest";
import { isDemoModeEnabled, parseEnv } from "./env";

describe("isDemoModeEnabled", () => {
  it.each([
    [{ DEMO_MODE: "true" }, true],
    [{ DEMO_MODE: "1" }, true],
    [{ DEMO_MODE: "false" }, false],
    [{ DEMO_MODE: "maybe" }, false],
    [{}, false],
  ])("%j -> %s", (source, expected) => {
    expect(isDemoModeEnabled(source)).toBe(expected);
  });

  it("does not need the Gemini key", () => {
    expect(isDemoModeEnabled({ DEMO_MODE: "true" })).toBe(true);
  });
});

describe("parseEnv", () => {
  it("applies defaults when only the key is set", () => {
    expect(parseEnv({ GEMINI_API_KEY: "key" })).toEqual({
      GEMINI_API_KEY: "key",
      GEMINI_MODEL: "gemini-3.8-flash",
      GEMINI_FALLBACK_MODEL: "gemini-3.5-flash-lite",
      IMAGE_PROVIDER: "pollinations",
      DEMO_MODE: false,
    });
  });

  it("treats empty values as unset", () => {
    const env = parseEnv({ GEMINI_API_KEY: "key", GEMINI_MODEL: "" });
    expect(env.GEMINI_MODEL).toBe("gemini-3.8-flash");
  });

  it("parses DEMO_MODE as a boolean", () => {
    expect(
      parseEnv({ GEMINI_API_KEY: "key", DEMO_MODE: "true" }).DEMO_MODE,
    ).toBe(true);
  });

  it("reports a missing key by name", () => {
    expect(() => parseEnv({})).toThrow("GEMINI_API_KEY: is required");
  });

  it("requires Cloudflare credentials only for the cloudflare provider", () => {
    expect(() =>
      parseEnv({ GEMINI_API_KEY: "key", IMAGE_PROVIDER: "cloudflare" }),
    ).toThrow(/CF_ACCOUNT_ID[\s\S]*CF_API_TOKEN/);
  });

  it("rejects an unknown image provider", () => {
    expect(() =>
      parseEnv({ GEMINI_API_KEY: "key", IMAGE_PROVIDER: "dalle" }),
    ).toThrow("IMAGE_PROVIDER");
  });
});
