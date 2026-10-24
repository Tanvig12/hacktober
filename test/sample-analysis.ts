import type { Analysis, Concept } from "@/types/analysis";

const concept: Omit<Concept, "kind"> = {
  title: "Desk organiser",
  description: "Cut and sand the bottle into a pen holder.",
  difficulty: "easy",
  time_minutes: 20,
  tools: ["craft knife", "sandpaper"],
  steps: ["Rinse", "Cut", "Sand", "Use"],
  image_prompt: "A clear PET pen holder on a plain background",
};

export const sampleAnalysis: Analysis = {
  object_name: "Plastic water bottle",
  confidence: "high",
  condition: "Empty and intact.",
  materials: [{ part: "body", material: "PET plastic" }],
  safety: {
    is_hazardous: false,
    contamination_risk: "low",
    hazards: [],
    handling_warning: "Rinse before handling.",
  },
  concepts: [
    { ...concept, kind: "repurpose" },
    { ...concept, kind: "repurpose" },
    { ...concept, kind: "upcycle" },
  ],
  recovery_plan: [
    {
      component: "body",
      material: "PET plastic",
      action: "recycle",
      destination: "kabadiwala",
    },
  ],
  impact_estimate: { landfill_diverted_kg: 0.02, co2e_saved_kg: 0.05 },
};
