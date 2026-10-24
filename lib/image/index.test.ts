import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Env } from "@/lib/env";

const env: Partial<Env> = {};

vi.mock("@/lib/env", () => ({ getEnv: () => env }));

const { getImageProvider, withSharedStyle } = await import("./index");
const { pollinationsProvider } = await import("./pollinations");

beforeEach(() => {
  for (const key of Object.keys(env)) delete env[key as keyof Env];
});

describe("getImageProvider", () => {
  it("defaults to Pollinations", () => {
    env.IMAGE_PROVIDER = "pollinations";
    expect(getImageProvider()).toBe(pollinationsProvider);
  });

  it("uses Cloudflare when configured", () => {
    Object.assign(env, {
      IMAGE_PROVIDER: "cloudflare",
      CF_ACCOUNT_ID: "acct",
      CF_API_TOKEN: "token",
    });
    expect(getImageProvider()).not.toBe(pollinationsProvider);
  });

  it("refuses Cloudflare without credentials", () => {
    env.IMAGE_PROVIDER = "cloudflare";
    expect(() => getImageProvider()).toThrow("Cloudflare credentials");
  });
});

describe("withSharedStyle", () => {
  it("appends the shared style with the object name", () => {
    expect(withSharedStyle("  A desk lamp.  ", " toaster ")).toBe(
      "A desk lamp. Style: product photograph of an object made from a reused toaster, soft daylight, plain neutral background, no text, no people, no logos.",
    );
  });
});
