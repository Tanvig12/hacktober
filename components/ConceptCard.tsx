"use client";

import { useId, useState } from "react";
import { formatConceptMeta, KIND_LABEL } from "@/lib/format";
import type { Concept } from "@/types/analysis";
import { ConceptImage } from "./ConceptImage";

const PREVIEW_STEPS = 3;

type ConceptCardProps = {
  concept: Concept;
  imageSrc: string | null;
};

export function ConceptCard({ concept, imageSrc }: ConceptCardProps) {
  const [expanded, setExpanded] = useState(false);
  const stepsId = useId();
  const kindLabel = KIND_LABEL[concept.kind];
  const hasMoreSteps = concept.steps.length > PREVIEW_STEPS;
  const visibleSteps = expanded
    ? concept.steps
    : concept.steps.slice(0, PREVIEW_STEPS);

  return (
    <article className="flex min-w-0 flex-col overflow-hidden rounded-md border border-line bg-white">
      <ConceptImage
        key={imageSrc ?? "none"}
        src={imageSrc}
        alt={`${concept.title}, made from this item`}
        fallbackLabel={kindLabel}
      />
      <div className="flex flex-1 flex-col p-5">
        <p className="font-mono text-sm text-accent">{kindLabel}</p>
        <h4 className="mt-1 text-lg font-semibold wrap-break-word">
          {concept.title}
        </h4>
        <p className="mt-2 text-muted">{concept.description}</p>
        <p className="mt-3 font-mono text-sm text-muted">
          {formatConceptMeta(concept)}
        </p>
        <ol id={stepsId} className="mt-4 list-decimal space-y-2 pl-5">
          {visibleSteps.map((step, index) => (
            <li key={index}>{step}</li>
          ))}
        </ol>
        {hasMoreSteps && (
          <button
            type="button"
            aria-expanded={expanded}
            aria-controls={stepsId}
            onClick={() => setExpanded(!expanded)}
            className="mt-4 self-start text-sm text-accent underline underline-offset-4 hover:no-underline"
          >
            {expanded
              ? "Show fewer steps"
              : `Show all steps (${concept.steps.length})`}
          </button>
        )}
      </div>
    </article>
  );
}
