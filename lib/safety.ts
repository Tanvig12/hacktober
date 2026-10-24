import type { Analysis, Safety } from "@/types/analysis";

export type SafetyLevel = "blocked" | "caution" | "clear";

export function safetyLevel(safety: Safety): SafetyLevel {
  if (safety.is_hazardous) return "blocked";
  if (safety.contamination_risk !== "low" || safety.hazards.length > 0) {
    return "caution";
  }
  return "clear";
}

export function enforceSafety(analysis: Analysis): Analysis {
  return analysis;
}
