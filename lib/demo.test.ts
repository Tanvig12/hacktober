import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { GatedAnalysisSchema } from "@/lib/ai/schema";
import { enforceSafety, safetyLevel } from "@/lib/safety";
import { DEMO_SAMPLES, isDemoRequested } from "./demo";

const FIXTURE_DIR = join(process.cwd(), "fixtures/demo");
const FIXTURES = readdirSync(FIXTURE_DIR)
  .filter((file) => file.endsWith(".json"))
  .map((file) => file.replace(/\.json$/, ""));

function publicFile(src: string): string {
  return join(process.cwd(), "public", src);
}

describe("demo fixtures", () => {
  it.each(FIXTURES)("%s matches the gated analysis schema", (id) => {
    const json: unknown = JSON.parse(
      readFileSync(join(FIXTURE_DIR, `${id}.json`), "utf8"),
    );
    const result = GatedAnalysisSchema.safeParse(json);
    expect(result.error?.issues ?? []).toEqual([]);
  });

  it.each(DEMO_SAMPLES.map((sample) => [sample.id, sample] as const))(
    "%s is already gated, so the safety gate leaves it unchanged",
    (_, sample) => {
      expect(enforceSafety(sample.analysis)).toEqual(sample.analysis);
    },
  );

  it("offers a sample for every fixture", () => {
    expect(DEMO_SAMPLES.map((sample) => sample.id).sort()).toEqual(
      [...FIXTURES].sort(),
    );
  });

  it("keeps the hand-written samples first, as written", () => {
    const summary = DEMO_SAMPLES.slice(0, 3).map((sample) => [
      sample.id,
      safetyLevel(sample.analysis.safety),
      sample.analysis.concepts.length,
    ]);
    expect(summary).toEqual([
      ["pet-bottle", "clear", 3],
      ["denim-jeans", "clear", 3],
      ["smartphone", "blocked", 0],
    ]);
  });

  it.each(DEMO_SAMPLES.map((sample) => [sample.id, sample] as const))(
    "%s shows ideas only when it is not blocked",
    (_, sample) => {
      const blocked = safetyLevel(sample.analysis.safety) === "blocked";
      const count = sample.analysis.concepts.length;
      expect(blocked ? count === 0 : count >= 1 && count <= 3).toBe(true);
    },
  );

  it("ships every photo and concept image it points to", () => {
    const files = DEMO_SAMPLES.flatMap((sample) => [
      sample.photoSrc,
      ...sample.images,
    ]);
    expect(files.filter((src) => !existsSync(publicFile(src)))).toEqual([]);
  });
});

describe("isDemoRequested", () => {
  it.each([
    ["?demo=1", true],
    ["?demo=0", false],
    ["?demo=true", false],
    ["", false],
  ])("%j -> %s", (search, expected) => {
    expect(isDemoRequested(new URLSearchParams(search))).toBe(expected);
  });
});
