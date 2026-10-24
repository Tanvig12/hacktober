import type {
  Concept,
  ConceptKind,
  ImpactEstimate,
  RecoveryAction,
} from "@/types/analysis";

export const KIND_LABEL: Record<ConceptKind, string> = {
  repair: "Repair",
  repurpose: "Repurpose",
  upcycle: "Upcycle",
};

export const ACTION_LABEL: Record<RecoveryAction, string> = {
  reuse: "reuse",
  recycle: "recycle",
  compost: "compost",
  "e-waste": "e-waste",
  "hazardous-drop-off": "hazardous drop-off",
  landfill: "landfill",
};

export function capitalize(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

// Model estimates are rough, so extra precision would only suggest false accuracy.
function roundKg(kg: number): string {
  const rounded = kg < 10 ? kg.toFixed(1) : kg.toFixed(0);
  return rounded.replace(/\.0$/, "");
}

function approxKg(kg: number): string {
  return kg < 0.05 ? "under 0.1 kg" : `about ${roundKg(kg)} kg`;
}

export function formatImpact(estimate: ImpactEstimate): string {
  const landfill = capitalize(approxKg(estimate.landfill_diverted_kg));
  const co2e = approxKg(estimate.co2e_saved_kg);
  return `${landfill} kept out of landfill · ${co2e} CO2e avoided (estimate)`;
}

export function formatMinutes(minutes: number): string {
  if (minutes < 1) return "under 1 min";
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return rest === 0 ? `${hours} h` : `${hours} h ${rest} min`;
}

export function formatToolCount(count: number): string {
  if (count === 0) return "no tools";
  return count === 1 ? "1 tool" : `${count} tools`;
}

export function formatConceptMeta(concept: Concept): string {
  return [
    capitalize(concept.difficulty),
    formatMinutes(concept.time_minutes),
    formatToolCount(concept.tools.length),
  ].join(" · ");
}
