import { describe, expect, it } from "vitest";
import type { ResizedImage } from "@/lib/resize";
import type { Analysis } from "@/types/analysis";
import { captureReducer, type CaptureState } from "./capture";

const photo: ResizedImage = {
  base64: "aGVsbG8=",
  mimeType: "image/jpeg",
  width: 10,
  height: 10,
};
const analysis = { object_name: "Toaster" } as Analysis;

describe("captureReducer", () => {
  it("walks the happy path from idle to done", () => {
    let state: CaptureState = { status: "idle" };
    state = captureReducer(state, { type: "select", photo });
    expect(state.status).toBe("selected");
    state = captureReducer(state, { type: "analyze" });
    expect(state.status).toBe("analyzing");
    state = captureReducer(state, { type: "succeed", analysis });
    expect(state).toEqual({ status: "done", photo, analysis });
  });

  it("retries from the error state with the same photo", () => {
    const error: CaptureState = { status: "error", photo, message: "x" };
    expect(captureReducer(error, { type: "analyze" })).toEqual({
      status: "analyzing",
      photo,
    });
  });

  it("ignores everything but the result while analyzing", () => {
    const analyzing: CaptureState = { status: "analyzing", photo };
    for (const action of [
      { type: "reset" },
      { type: "analyze" },
      { type: "select", photo },
    ] as const) {
      expect(captureReducer(analyzing, action)).toBe(analyzing);
    }
  });

  it("does not analyze without a photo", () => {
    const idle: CaptureState = { status: "idle" };
    expect(captureReducer(idle, { type: "analyze" })).toBe(idle);
  });

  it("keeps an input error in the idle state", () => {
    expect(
      captureReducer({ status: "idle" }, { type: "reject", message: "bad" }),
    ).toEqual({ status: "idle", inputError: "bad" });
  });
});
