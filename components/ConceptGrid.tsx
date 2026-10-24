"use client";

import { useConceptImages } from "@/lib/use-concept-images";
import type { Concept } from "@/types/analysis";
import { ConceptCard } from "./ConceptCard";

type ConceptGridProps = {
  objectName: string;
  concepts: Concept[];
};

export function ConceptGrid({ objectName, concepts }: ConceptGridProps) {
  const images = useConceptImages(objectName, concepts);

  return (
    <div className="mt-5 grid gap-6 md:grid-cols-3">
      {concepts.map((concept, index) => (
        <ConceptCard key={index} concept={concept} image={images[index]} />
      ))}
    </div>
  );
}
