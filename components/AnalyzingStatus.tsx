"use client";

import { useEffect, useState } from "react";

const STEPS = [
  "Identifying the object",
  "Checking materials and hazards",
  "Drafting reuse ideas",
];
const STEP_MS = 2500;

export function AnalyzingStatus() {
  const [step, setStep] = useState(0);

  useEffect(() => {
    if (step >= STEPS.length - 1) return;
    const timer = setTimeout(() => setStep(step + 1), STEP_MS);
    return () => clearTimeout(timer);
  }, [step]);

  return (
    <div>
      <div
        role="progressbar"
        aria-label="Analysing photo"
        className="h-0.5 overflow-hidden bg-line"
      >
        <div className="h-full w-1/3 animate-indeterminate bg-accent motion-reduce:w-full motion-reduce:animate-none" />
      </div>
      <p aria-live="polite" className="mt-4">
        {STEPS[step]}
      </p>
    </div>
  );
}
