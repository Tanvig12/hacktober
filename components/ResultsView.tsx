import type { ResizedImage } from "@/lib/resize";
import { safetyLevel } from "@/lib/safety";
import type { Analysis } from "@/types/analysis";
import { ImpactStrip } from "./ImpactStrip";
import { ObjectSummary } from "./ObjectSummary";
import { PhotoPreview } from "./PhotoPreview";
import { RecoveryPlan } from "./RecoveryPlan";
import { ReuseIdeas } from "./ReuseIdeas";
import { SafetyBanner } from "./SafetyBanner";

type ResultsViewProps = {
  photo: ResizedImage;
  analysis: Analysis;
  presetImages?: string[];
  onReset: () => void;
};

export function ResultsView({
  photo,
  analysis,
  presetImages,
  onReset,
}: ResultsViewProps) {
  const level = safetyLevel(analysis.safety);

  return (
    <div className="mt-10">
      <div className="grid gap-8 md:grid-cols-[2fr_3fr] md:gap-12">
        <PhotoPreview
          photo={photo}
          dimmed={false}
          alt={`Your photo: ${analysis.object_name}`}
        />
        <div className="min-w-0 space-y-6">
          <ObjectSummary analysis={analysis} />
          <SafetyBanner level={level} safety={analysis.safety} />
          <ImpactStrip estimate={analysis.impact_estimate} />
          <button
            type="button"
            onClick={onReset}
            className="rounded-sm border border-ink px-4 py-2 font-medium hover:bg-ink hover:text-paper"
          >
            Try another item
          </button>
        </div>
      </div>
      <ReuseIdeas
        objectName={analysis.object_name}
        concepts={analysis.concepts}
        blocked={level === "blocked"}
        presetImages={presetImages}
      />
      <RecoveryPlan steps={analysis.recovery_plan} />
    </div>
  );
}
