import { describe, expect, it } from "vitest";
import type { Concept } from "@/types/analysis";
import {
  formatConceptMeta,
  formatImpact,
  formatMinutes,
  formatToolCount,
} from "./format";

describe("formatImpact", () => {
  it("rounds small values to one decimal and large ones to whole kg", () => {
    expect(
      formatImpact({ landfill_diverted_kg: 2.24, co2e_saved_kg: 12.6 }),
    ).toBe(
      "About 2.2 kg kept out of landfill · about 13 kg CO2e avoided (estimate)",
    );
  });

  it("drops a trailing .0", () => {
    expect(formatImpact({ landfill_diverted_kg: 3, co2e_saved_kg: 1.04 })).toBe(
      "About 3 kg kept out of landfill · about 1 kg CO2e avoided (estimate)",
    );
  });

  it("says under 0.1 kg instead of rounding to zero", () => {
    expect(formatImpact({ landfill_diverted_kg: 0.02, co2e_saved_kg: 0 })).toBe(
      "Under 0.1 kg kept out of landfill · under 0.1 kg CO2e avoided (estimate)",
    );
  });
});

describe("formatMinutes", () => {
  it.each([
    [0, "under 1 min"],
    [30, "30 min"],
    [60, "1 h"],
    [95, "1 h 35 min"],
  ])("formats %i", (minutes, expected) => {
    expect(formatMinutes(minutes)).toBe(expected);
  });
});

describe("formatToolCount", () => {
  it.each([
    [0, "no tools"],
    [1, "1 tool"],
    [4, "4 tools"],
  ])("formats %i", (count, expected) => {
    expect(formatToolCount(count)).toBe(expected);
  });
});

describe("formatConceptMeta", () => {
  it("joins difficulty, time and tools", () => {
    const concept = {
      difficulty: "easy",
      time_minutes: 30,
      tools: ["a", "b", "c", "d"],
    } as Concept;
    expect(formatConceptMeta(concept)).toBe("Easy · 30 min · 4 tools");
  });
});
