import { Check, TriangleAlert } from "lucide-react";
import { capitalize } from "@/lib/format";
import type { SafetyLevel } from "@/lib/safety";
import type { Safety } from "@/types/analysis";

type SafetyBannerProps = {
  level: SafetyLevel;
  safety: Safety;
};

export function SafetyBanner({ level, safety }: SafetyBannerProps) {
  if (level === "clear") {
    return (
      <p className="flex items-center gap-2 text-sm text-safe">
        <Check aria-hidden className="size-4" />
        Low risk to reuse
      </p>
    );
  }

  if (level === "caution") {
    return (
      <div className="rounded-md border border-caution bg-caution/5 p-4">
        <h3 className="flex items-center gap-2 font-semibold text-caution">
          <TriangleAlert aria-hidden className="size-4 shrink-0" />
          Clean and check before reuse
        </h3>
        <p className="mt-2">{safety.handling_warning}</p>
      </div>
    );
  }

  return (
    <div
      role="alert"
      className="rounded-md border border-danger bg-danger/5 p-4"
    >
      <h3 className="flex items-center gap-2 font-semibold text-danger">
        <TriangleAlert aria-hidden className="size-4 shrink-0" />
        Don&rsquo;t reuse this at home
      </h3>
      <p className="mt-2">{safety.handling_warning}</p>
      {safety.hazards.length > 0 && (
        <ul
          aria-label="Hazards"
          className="mt-3 list-disc space-y-1 pl-5 text-sm"
        >
          {safety.hazards.map((hazard, index) => (
            <li key={index}>{capitalize(hazard)}</li>
          ))}
        </ul>
      )}
      <a
        href="#recovery-plan"
        className="mt-3 inline-block text-sm font-medium text-danger underline underline-offset-4 hover:no-underline"
      >
        See where it should go
      </a>
    </div>
  );
}
