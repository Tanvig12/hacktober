"use client";

import { useReducer } from "react";
import { AnalysisPanel } from "@/components/AnalysisPanel";
import { PhotoInput } from "@/components/PhotoInput";
import { PhotoPreview } from "@/components/PhotoPreview";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import { errorMessage, requestAnalysis } from "@/lib/analyze-request";
import { captureReducer, initialCaptureState } from "@/lib/capture";
import {
  resizeImage,
  UnsupportedImageError,
  type ResizedImage,
} from "@/lib/resize";

export default function Home() {
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

  return (
    <>
      <SiteHeader />
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-10 sm:px-6 sm:py-14">
        <h1 className="max-w-2xl text-xl font-semibold sm:text-2xl">
          Take a photo of something you&rsquo;re about to throw away.
        </h1>
        <p className="mt-3 max-w-2xl text-lg text-muted">
          You get a safety check, three ways to give it a second life, and where
          each material should go.
        </p>

        {state.status === "idle" ? (
          <div className="mt-10 max-w-2xl">
            <PhotoInput onSelect={handleFile} error={state.inputError} />
          </div>
        ) : (
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
            />
          </div>
        )}
      </main>
      <SiteFooter />
    </>
  );
}
