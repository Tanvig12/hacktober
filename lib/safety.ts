import type { Analysis, Concept, RecoveryStep, Safety } from "@/types/analysis";

export type SafetyLevel = "blocked" | "caution" | "clear";

type Risk = Safety["contamination_risk"];
type Reroute = Pick<RecoveryStep, "action" | "destination">;

type HazardRule = {
  label: string;
  pattern: RegExp;
  hazardous: boolean;
  contamination?: Risk;
  reroute?: Reroute;
};

const E_WASTE: Reroute = {
  action: "e-waste",
  destination: "Authorised e-waste recycler",
};
const HAZARDOUS_DROP_OFF: Reroute = {
  action: "hazardous-drop-off",
  destination: "Municipal hazardous-waste drop-off",
};

const RULES: HazardRule[] = [
  {
    label: "Battery",
    pattern: /\b(batter(y|ies)|lithium|li-?ion|button cells?)\b/gi,
    hazardous: true,
    reroute: E_WASTE,
  },
  {
    label: "Electronic components",
    pattern: /\b(e-waste|circuit boards?|pcbs?|electronics?)\b/gi,
    hazardous: true,
    reroute: E_WASTE,
  },
  {
    label: "Broken glass",
    pattern:
      /\b((broken|shattered|cracked) glass|glass (shards?|fragments?)|shards?)\b/gi,
    hazardous: true,
  },
  {
    label: "Chemicals or paint",
    pattern:
      /\b(chemicals?|solvents?|pesticides?|insecticides?|bleach|acids?|paint (cans?|tins?|thinner)|lead paint|wet paint|turpentine|motor oil)\b/gi,
    hazardous: true,
    reroute: HAZARDOUS_DROP_OFF,
  },
  {
    label: "Pressurised aerosol",
    pattern: /\b(aerosols?|spray cans?|pressuri[sz]ed)\b/gi,
    hazardous: true,
    reroute: HAZARDOUS_DROP_OFF,
  },
  {
    label: "Medical waste",
    pattern:
      /\b(syringes?|hypodermic|medical waste|medicines?|medications?|insulin|blood|sharps)\b/gi,
    hazardous: true,
    reroute: HAZARDOUS_DROP_OFF,
  },
  {
    label: "Mercury or asbestos",
    pattern: /\b(mercury|asbestos|cfls?|fluorescent tubes?)\b/gi,
    hazardous: true,
    reroute: HAZARDOUS_DROP_OFF,
  },
  {
    label: "Mould",
    pattern: /\b(mou?ldy?|mildew)\b/gi,
    hazardous: false,
    contamination: "high",
  },
  {
    label: "Food residue",
    pattern:
      /\b(food residue|leftover food|grease|greasy|rotten|spoiled|spoilt)\b/gi,
    hazardous: false,
    contamination: "medium",
  },
  {
    label: "Sharp or rusted metal",
    pattern: /\b(rust|rusty|rusted|sharp edges?|jagged|razors?|blades?)\b/gi,
    hazardous: false,
  },
];

const CLOSE_CONTACT =
  /\b(food|drinks?|drinking|eat|eating|cups?|mugs?|plates?|bowls?|lunch ?box|kitchen|cooking|bab(y|ies)|child(ren)?|kids?|toys?|skin|jewell?ery|wearable|cosmetics?)\b/i;

const RISK_ORDER: Risk[] = ["low", "medium", "high"];

const NEGATED_BEFORE = /\b(no|not|without|free (of|from)|non)\b[^.,;]*$/i;

// "No mould visible" and "rust-free" describe an absence, so they must not raise risk.
function mentions(text: string, pattern: RegExp): boolean {
  for (const match of text.matchAll(pattern)) {
    const before = text.slice(Math.max(0, match.index - 30), match.index);
    const after = text.slice(match.index + match[0].length);
    if (!NEGATED_BEFORE.test(before) && !/^-?free\b/i.test(after)) return true;
  }
  return false;
}

function describedText(analysis: Analysis): string {
  return [
    analysis.object_name,
    analysis.condition,
    ...analysis.materials.flatMap((m) => [m.part, m.material]),
    ...analysis.safety.hazards,
    ...analysis.recovery_plan.flatMap((s) => [s.component, s.material]),
  ].join(". ");
}

function higherRisk(a: Risk, b: Risk): Risk {
  return RISK_ORDER.indexOf(a) >= RISK_ORDER.indexOf(b) ? a : b;
}

function raiseSafety(safety: Safety, found: HazardRule[]): Safety {
  const hazardous = safety.is_hazardous || found.some((rule) => rule.hazardous);
  const contamination = found.reduce<Risk>(
    (risk, rule) => higherRisk(risk, rule.contamination ?? "low"),
    safety.contamination_risk,
  );
  const listed = safety.hazards.join(". ");
  const newLabels = found
    .filter((rule) => !mentions(listed, rule.pattern))
    .map((rule) => rule.label);
  const raisedToHazardous = hazardous && !safety.is_hazardous;

  return {
    is_hazardous: hazardous,
    contamination_risk: contamination,
    hazards: [...safety.hazards, ...newLabels],
    handling_warning: raisedToHazardous
      ? `${safety.handling_warning} Do not take it apart. Take it to an authorised collection point.`.trim()
      : safety.handling_warning,
  };
}

function rerouteStep(step: RecoveryStep): RecoveryStep {
  if (step.action === "e-waste" || step.action === "hazardous-drop-off") {
    return step;
  }
  const text = `${step.component}. ${step.material}`;
  const rule = RULES.find((r) => r.reroute && mentions(text, r.pattern));
  return rule?.reroute ? { ...step, ...rule.reroute } : step;
}

function safeConcepts(concepts: Concept[], safety: Safety): Concept[] {
  if (safety.is_hazardous) return [];
  if (safety.contamination_risk !== "high") return concepts;
  return concepts.filter(
    (concept) =>
      !CLOSE_CONTACT.test(`${concept.title}. ${concept.description}`),
  );
}

// Risk can only go up here: the model's own rating is the floor.
export function enforceSafety(analysis: Analysis): Analysis {
  const text = describedText(analysis);
  const found = RULES.filter((rule) => mentions(text, rule.pattern));
  const safety = raiseSafety(analysis.safety, found);

  return {
    ...analysis,
    safety,
    concepts: safeConcepts(analysis.concepts, safety),
    recovery_plan: safety.is_hazardous
      ? analysis.recovery_plan.map(rerouteStep)
      : analysis.recovery_plan,
  };
}

export function safetyLevel(safety: Safety): SafetyLevel {
  if (safety.is_hazardous) return "blocked";
  if (safety.contamination_risk !== "low" || safety.hazards.length > 0) {
    return "caution";
  }
  return "clear";
}
