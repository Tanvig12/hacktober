import { formatImpact } from "@/lib/format";
import type { ImpactEstimate } from "@/types/analysis";

type ImpactStripProps = {
  estimate: ImpactEstimate;
};

export function ImpactStrip({ estimate }: ImpactStripProps) {
  return (
    <p className="border-y border-line py-3 font-mono text-sm text-muted">
      {formatImpact(estimate)}
    </p>
  );
}
