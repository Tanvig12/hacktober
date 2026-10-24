import type { Schema } from "@google/genai";
import { describe, expect, it } from "vitest";
import { z } from "zod";
import { AnalysisSchema, analysisResponseSchema } from "./schema";

type Shape = {
  type: string;
  enum?: string[];
  required?: string[];
  properties?: Record<string, Shape>;
  items?: Shape;
  minItems?: number;
  maxItems?: number;
};

type JsonSchema = z.core.JSONSchema.JSONSchema;

function fromJsonSchema(node: JsonSchema | boolean | undefined): Shape {
  if (typeof node !== "object") throw new Error("unexpected JSON schema node");
  return {
    type: String(node.type),
    enum: node.enum?.map(String),
    required: node.required,
    properties: node.properties
      ? Object.fromEntries(
          Object.entries(node.properties).map(([k, v]) => [
            k,
            fromJsonSchema(v),
          ]),
        )
      : undefined,
    items: node.items ? fromJsonSchema(node.items as JsonSchema) : undefined,
    minItems: node.minItems,
    maxItems: node.maxItems,
  };
}

function fromGemini(node: Schema): Shape {
  return {
    type: String(node.type).toLowerCase(),
    enum: node.enum,
    required: node.required,
    properties: node.properties
      ? Object.fromEntries(
          Object.entries(node.properties).map(([k, v]) => [k, fromGemini(v)]),
        )
      : undefined,
    items: node.items ? fromGemini(node.items) : undefined,
    minItems: node.minItems === undefined ? undefined : Number(node.minItems),
    maxItems: node.maxItems === undefined ? undefined : Number(node.maxItems),
  };
}

describe("analysis schemas", () => {
  it("keeps the Gemini response schema in step with the zod schema", () => {
    const zodShape = fromJsonSchema(z.toJSONSchema(AnalysisSchema));
    expect(fromGemini(analysisResponseSchema)).toEqual(zodShape);
  });

  it("orders Gemini properties the same way as the zod schema", () => {
    expect(analysisResponseSchema.propertyOrdering).toEqual(
      Object.keys(AnalysisSchema.shape),
    );
  });
});
