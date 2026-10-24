import { z } from "zod";

export const CONFIDENCE = ["high", "medium", "low"] as const;
export const RISK = ["low", "medium", "high"] as const;
export const CONCEPT_KIND = ["repair", "repurpose", "upcycle"] as const;
export const DIFFICULTY = ["easy", "medium", "hard"] as const;
export const RECOVERY_ACTION = [
  "reuse",
  "recycle",
  "compost",
  "e-waste",
  "hazardous-drop-off",
  "landfill",
] as const;

const MaterialSchema = z.object({
  part: z.string(),
  material: z.string(),
});

const SafetySchema = z.object({
  is_hazardous: z.boolean(),
  contamination_risk: z.enum(RISK),
  hazards: z.array(z.string()),
  handling_warning: z.string(),
});

const ConceptSchema = z.object({
  kind: z.enum(CONCEPT_KIND),
  title: z.string(),
  description: z.string(),
  difficulty: z.enum(DIFFICULTY),
  time_minutes: z.number().int().nonnegative(),
  tools: z.array(z.string()),
  steps: z.array(z.string()),
  image_prompt: z.string(),
});

const RecoveryStepSchema = z.object({
  component: z.string(),
  material: z.string(),
  action: z.enum(RECOVERY_ACTION),
  destination: z.string(),
});

const ImpactEstimateSchema = z.object({
  landfill_diverted_kg: z.number().nonnegative(),
  co2e_saved_kg: z.number().nonnegative(),
});

export const AnalysisSchema = z.object({
  object_name: z.string(),
  confidence: z.enum(CONFIDENCE),
  condition: z.string(),
  materials: z.array(MaterialSchema),
  safety: SafetySchema,
  concepts: z.array(ConceptSchema).length(3),
  recovery_plan: z.array(RecoveryStepSchema),
  impact_estimate: ImpactEstimateSchema,
});

// The safety gate can remove concepts, so the API response allows fewer than three.
export const GatedAnalysisSchema = AnalysisSchema.extend({
  concepts: z.array(ConceptSchema).max(3),
});
