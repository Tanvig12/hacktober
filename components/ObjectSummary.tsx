"use client";

import { useEffect, useRef } from "react";
import { capitalize } from "@/lib/format";
import type { Analysis } from "@/types/analysis";

type ObjectSummaryProps = {
  analysis: Analysis;
};

export function ObjectSummary({ analysis }: ObjectSummaryProps) {
  const headingRef = useRef<HTMLHeadingElement>(null);

  // Mounting means results just arrived, so screen reader and keyboard users land on them.
  useEffect(() => {
    headingRef.current?.focus();
  }, []);

  return (
    <div className="min-w-0">
      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-2">
        <h2
          ref={headingRef}
          tabIndex={-1}
          className="min-w-0 text-xl font-semibold wrap-break-word"
        >
          {capitalize(analysis.object_name)}
        </h2>
        <span className="rounded-sm border border-line px-1.5 font-mono text-sm text-muted">
          {capitalize(analysis.confidence)} confidence
        </span>
      </div>
      <p className="mt-2 text-muted">{analysis.condition}</p>
      {analysis.materials.length > 0 && (
        <ul aria-label="Materials" className="mt-4 flex flex-wrap gap-2">
          {analysis.materials.map((material, index) => (
            <li
              key={index}
              className="max-w-full rounded-sm border border-line bg-white px-2 py-1 font-mono text-sm wrap-break-word"
            >
              {capitalize(material.part)}: {material.material}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
