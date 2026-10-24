import type { z } from "zod";
import type { AnalysisSchema } from "@/lib/ai/schema";

export type Analysis = z.infer<typeof AnalysisSchema>;
export type Material = Analysis["materials"][number];
export type Safety = Analysis["safety"];
export type Concept = Analysis["concepts"][number];
export type ConceptKind = Concept["kind"];
export type RecoveryStep = Analysis["recovery_plan"][number];
export type RecoveryAction = RecoveryStep["action"];
export type ImpactEstimate = Analysis["impact_estimate"];
