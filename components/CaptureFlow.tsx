"use client";

import { Suspense, useReducer } from "react";
import { errorMessage, requestAnalysis } from "@/lib/analyze-request";
import { captureReducer, initialCaptureState } from "@/lib/capture";
import { FALLBACK_SAMPLE, playSample, type DemoSample } from "@/lib/demo";
import {
  resizeImage,
  UnsupportedImageError,
  type ResizedImage,
} from "@/lib/resize";
import { AnalysisPanel } from "./AnalysisPanel";
import { DemoSamples } from "./DemoSamples";
import { PhotoInput } from "./PhotoInput";
import { PhotoPreview } from "./PhotoPreview";
import { ResultsView } from "./ResultsView";

type CaptureFlowProps = {
  demoEnabled: boolean;
};

export function CaptureFlow({ demoEnabled }: CaptureFlowProps) {
  const [state, dispatch] = useReducer(captureReducer, initialCaptureState);

  async function handleFile(file: File) {
    try {
      dispatch({ type: "select", photo: await resizeImage(file) });
    } catch (error) {
      const message =
        error instanceof UnsupportedImageError
          ? error.message
          : "That photo could not be opened. Try a different one.";
      dispatch({ type: "reject", message });
    }
  }

  async function analyze(photo: ResizedImage) {
    dispatch({ type: "analyze" });
    try {
      dispatch({ type: "succeed", analysis: await requestAnalysis(photo) });
    } catch (error) {
      dispatch({ type: "fail", message: errorMessage(error) });
    }
  }

  function showSample(sample: DemoSample) {
    playSample(sample, dispatch).catch(() =>
      dispatch({ type: "reject", message: "The sample could not be loaded." }),
    );
  }

  if (state.status === "idle") {
    return (
      <div className="mt-10 max-w-2xl">
        <Suspense fallback={null}>
          <DemoSamples enabled={demoEnabled} onChoose={showSample} />
        </Suspense>
        <PhotoInput onSelect={handleFile} error={state.inputError} />
      </div>
    );
  }

  if (state.status === "done") {
    return (
      <ResultsView
        photo={state.photo}
        analysis={state.analysis}
        presetImages={state.images}
        onReset={() => dispatch({ type: "reset" })}
      />
    );
  }

  return (
    <div className="mt-10 grid gap-8 md:grid-cols-[2fr_3fr] md:gap-12">
      <PhotoPreview
        photo={state.photo}
        dimmed={state.status === "analyzing"}
        onChangePhoto={
          state.status === "analyzing"
            ? undefined
            : () => dispatch({ type: "reset" })
        }
      />
      <AnalysisPanel
        state={state}
        onAnalyze={() => analyze(state.photo)}
        onShowSample={() => showSample(FALLBACK_SAMPLE)}
      />
    </div>
  );
}
