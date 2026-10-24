import type { CaptureState } from "@/lib/capture";
import { AnalyzingStatus } from "./AnalyzingStatus";
import { ErrorNotice } from "./ErrorNotice";

type AnalysisPanelProps = {
  state: Exclude<CaptureState, { status: "idle" }>;
  onAnalyze: () => void;
};

export function AnalysisPanel({ state, onAnalyze }: AnalysisPanelProps) {
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
      return <ErrorNotice message={state.message} onRetry={onAnalyze} />;
    case "done":
      return (
        <pre className="max-h-[70vh] overflow-auto rounded-md border border-line bg-white p-4 font-mono text-sm">
          {JSON.stringify(state.analysis, null, 2)}
        </pre>
      );
  }
}
