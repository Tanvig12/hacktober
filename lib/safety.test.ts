import { describe, expect, it } from "vitest";
import type { Safety } from "@/types/analysis";
import { safetyLevel } from "./safety";

const safe: Safety = {
  is_hazardous: false,
  contamination_risk: "low",
  hazards: [],
  handling_warning: "",
};

describe("safetyLevel", () => {
  it("blocks hazardous items whatever the contamination risk", () => {
    expect(safetyLevel({ ...safe, is_hazardous: true })).toBe("blocked");
  });

  it.each(["medium", "high"] as const)(
    "asks for caution at %s contamination risk",
    (contamination_risk) => {
      expect(safetyLevel({ ...safe, contamination_risk })).toBe("caution");
    },
  );

  it("asks for caution when hazards are listed on a non-hazardous item", () => {
    expect(safetyLevel({ ...safe, hazards: ["sharp edge"] })).toBe("caution");
  });

  it("clears low-risk items", () => {
    expect(safetyLevel(safe)).toBe("clear");
  });
});
