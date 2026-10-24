import type { ResizedImage } from "@/lib/resize";
import type { Analysis } from "@/types/analysis";

export type CaptureState =
  | { status: "idle"; inputError?: string }
  | { status: "selected"; photo: ResizedImage }
  | { status: "analyzing"; photo: ResizedImage }
  | { status: "done"; photo: ResizedImage; analysis: Analysis }
  | { status: "error"; photo: ResizedImage; message: string };

export type CaptureAction =
  | { type: "select"; photo: ResizedImage }
  | { type: "reject"; message: string }
  | { type: "reset" }
  | { type: "analyze" }
  | { type: "succeed"; analysis: Analysis }
  | { type: "fail"; message: string };

export const initialCaptureState: CaptureState = { status: "idle" };

// Transitions not listed for a state are ignored, so a stray action cannot skip a step.
export function captureReducer(
  state: CaptureState,
  action: CaptureAction,
): CaptureState {
  if (state.status === "analyzing") {
    if (action.type === "succeed") {
      return { status: "done", photo: state.photo, analysis: action.analysis };
    }
    if (action.type === "fail") {
      return { status: "error", photo: state.photo, message: action.message };
    }
    return state;
  }

  switch (action.type) {
    case "select":
      return { status: "selected", photo: action.photo };
    case "reject":
      return { status: "idle", inputError: action.message };
    case "reset":
      return { status: "idle" };
    case "analyze":
      return state.status === "selected" || state.status === "error"
        ? { status: "analyzing", photo: state.photo }
        : state;
    default:
      return state;
  }
}
