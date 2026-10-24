import { describe, expect, it } from "vitest";
import { sampleAnalysis } from "@/test/sample-analysis";
import type { Analysis, Safety } from "@/types/analysis";
import { enforceSafety, safetyLevel } from "./safety";

const safe: Safety = {
  is_hazardous: false,
  contamination_risk: "low",
  hazards: [],
  handling_warning: "",
};

function withChanges(changes: Partial<Analysis>): Analysis {
  return { ...structuredClone(sampleAnalysis), ...changes };
}

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

describe("enforceSafety", () => {
  it("leaves a clean item unchanged", () => {
    expect(enforceSafety(sampleAnalysis)).toEqual(sampleAnalysis);
  });

  it("strips every concept when the model flags the item as hazardous", () => {
    const analysis = withChanges({
      safety: { ...sampleAnalysis.safety, is_hazardous: true },
    });
    expect(enforceSafety(analysis).concepts).toEqual([]);
  });

  it("raises a battery the model missed to hazardous", () => {
    const analysis = withChanges({
      object_name: "Bluetooth speaker",
      materials: [
        { part: "shell", material: "ABS plastic" },
        { part: "power pack", material: "lithium-ion battery" },
      ],
      recovery_plan: [
        {
          component: "power pack",
          material: "lithium-ion battery",
          action: "landfill",
          destination: "household bin",
        },
        {
          component: "shell",
          material: "ABS plastic",
          action: "recycle",
          destination: "kabadiwala",
        },
      ],
    });

    const gated = enforceSafety(analysis);

    expect(gated.safety.is_hazardous).toBe(true);
    expect(gated.safety.hazards).toContain("Battery");
    expect(gated.safety.handling_warning).toMatch(/Do not take it apart/);
    expect(gated.concepts).toEqual([]);
    expect(gated.recovery_plan[0]).toMatchObject({
      action: "e-waste",
      destination: "Authorised e-waste recycler",
    });
    expect(gated.recovery_plan[1].action).toBe("recycle");
  });

  it("does not add a label the model already gave", () => {
    const analysis = withChanges({
      materials: [{ part: "cell", material: "lithium battery" }],
      safety: {
        ...sampleAnalysis.safety,
        is_hazardous: true,
        hazards: ["Swollen lithium battery"],
      },
    });
    expect(enforceSafety(analysis).safety.hazards).toEqual([
      "Swollen lithium battery",
    ]);
  });

  it("never lowers the model's rating", () => {
    const safety: Safety = {
      is_hazardous: true,
      contamination_risk: "high",
      hazards: ["Unknown residue"],
      handling_warning: "Wear gloves.",
    };
    expect(enforceSafety(withChanges({ safety })).safety).toEqual(safety);
  });

  it("raises contamination for mould and drops close-contact ideas", () => {
    const [first, second, third] = sampleAnalysis.concepts;
    const analysis = withChanges({
      condition: "Visible mould along the lid seal.",
      concepts: [
        { ...first, title: "Kitchen spice jar" },
        { ...second, title: "Kids' bath toy" },
        { ...third, title: "Seed starter pot" },
      ],
    });

    const gated = enforceSafety(analysis);

    expect(gated.safety.contamination_risk).toBe("high");
    expect(gated.safety.hazards).toContain("Mould");
    expect(gated.concepts.map((c) => c.title)).toEqual(["Seed starter pot"]);
  });

  it("raises food residue to medium without touching concepts", () => {
    const gated = enforceSafety(
      withChanges({ condition: "Greasy inside with food residue." }),
    );
    expect(gated.safety.contamination_risk).toBe("medium");
    expect(gated.concepts).toHaveLength(3);
  });

  it.each([
    "No mould or rust visible.",
    "Rust-free steel frame.",
    "Made of moulded polypropylene.",
    "Free of chemicals and food residue.",
  ])("ignores %j", (condition) => {
    const gated = enforceSafety(withChanges({ condition }));
    expect(gated.safety).toEqual(sampleAnalysis.safety);
  });

  it("does not mutate its input", () => {
    const analysis = withChanges({ condition: "Cracked glass panel." });
    const before = structuredClone(analysis);
    enforceSafety(analysis);
    expect(analysis).toEqual(before);
  });
});
