import type { CaptureState } from "@/lib/capture";
import { AnalyzingStatus } from "./AnalyzingStatus";
import { ErrorNotice } from "./ErrorNotice";

type AnalysisPanelProps = {
  state: Extract<CaptureState, { status: "selected" | "analyzing" | "error" }>;
  onAnalyze: () => void;
  onShowSample: () => void;
};

export function AnalysisPanel({
  state,
  onAnalyze,
  onShowSample,
}: AnalysisPanelProps) {
  switch (state.status) {
    case "selected":
      return (
        <div>
          <p className="text-muted">
            Check the whole object is in frame, then analyse it.
          </p>
          <button
            type="button"
            onClick={onAnalyze}
            autoFocus
            className="mt-4 rounded-sm bg-accent px-4 py-2 font-medium text-paper hover:bg-accent/90"
          >
            Analyse photo
          </button>
        </div>
      );
    case "analyzing":
      return <AnalyzingStatus />;
    case "error":
      return (
        <ErrorNotice
          message={state.message}
          onRetry={onAnalyze}
          onShowSample={onShowSample}
        />
      );
  }
}
