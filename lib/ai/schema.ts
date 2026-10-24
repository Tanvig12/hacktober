import { Type, type Schema } from "@google/genai";
import { z } from "zod";

const CONFIDENCE = ["high", "medium", "low"] as const;
const RISK = ["low", "medium", "high"] as const;
const CONCEPT_KIND = ["repair", "repurpose", "upcycle"] as const;
const DIFFICULTY = ["easy", "medium", "hard"] as const;
const RECOVERY_ACTION = [
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

// Every field is required and kept in declaration order so the model fills them predictably.
function object(properties: Record<string, Schema>): Schema {
  const keys = Object.keys(properties);
  return {
    type: Type.OBJECT,
    properties,
    required: keys,
    propertyOrdering: keys,
  };
}

const string: Schema = { type: Type.STRING };
const stringList: Schema = { type: Type.ARRAY, items: string };
const number: Schema = { type: Type.NUMBER, minimum: 0 };

function oneOf(values: readonly string[]): Schema {
  return { type: Type.STRING, enum: [...values] };
}

export const analysisResponseSchema: Schema = object({
  object_name: string,
  confidence: oneOf(CONFIDENCE),
  condition: string,
  materials: {
    type: Type.ARRAY,
    items: object({ part: string, material: string }),
  },
  safety: object({
    is_hazardous: { type: Type.BOOLEAN },
    contamination_risk: oneOf(RISK),
    hazards: stringList,
    handling_warning: string,
  }),
  concepts: {
    type: Type.ARRAY,
    minItems: "3",
    maxItems: "3",
    items: object({
      kind: oneOf(CONCEPT_KIND),
      title: string,
      description: string,
      difficulty: oneOf(DIFFICULTY),
      time_minutes: { type: Type.INTEGER, minimum: 0 },
      tools: stringList,
      steps: stringList,
      image_prompt: string,
    }),
  },
  recovery_plan: {
    type: Type.ARRAY,
    items: object({
      component: string,
      material: string,
      action: oneOf(RECOVERY_ACTION),
      destination: string,
    }),
  },
  impact_estimate: object({
    landfill_diverted_kg: number,
    co2e_saved_kg: number,
  }),
});
