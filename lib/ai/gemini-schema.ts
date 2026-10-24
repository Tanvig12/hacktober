import "server-only";
import { Type, type Schema } from "@google/genai";
import {
  CONCEPT_KIND,
  CONFIDENCE,
  DIFFICULTY,
  RECOVERY_ACTION,
  RISK,
} from "./schema";

// Kept apart from schema.ts so client code can validate responses without bundling the SDK.

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
