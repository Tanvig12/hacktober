import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { GatedAnalysisSchema } from "@/lib/ai/schema";
import { enforceSafety, safetyLevel } from "@/lib/safety";
import { DEMO_SAMPLES, isDemoRequested } from "./demo";

const FIXTURES = ["pet-bottle", "denim-jeans", "smartphone"];

function publicFile(src: string): string {
  return join(process.cwd(), "public", src);
}

describe("demo fixtures", () => {
  it.each(FIXTURES)("%s matches the gated analysis schema", (id) => {
    const json: unknown = JSON.parse(
      readFileSync(join(process.cwd(), "fixtures/demo", `${id}.json`), "utf8"),
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

  it("covers two clear items with three ideas and one blocked item with none", () => {
    const summary = DEMO_SAMPLES.map((sample) => [
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
