"use client";

import { useEffect, useState } from "react";
import { conceptSeed, requestImage } from "@/lib/image-request";
import type { Concept } from "@/types/analysis";

export type ConceptImageState =
  | { status: "pending" }
  | { status: "ready"; src: string }
  | { status: "failed" };

// presetImages are already on hand (the demo samples), so nothing is requested for them.
export function useConceptImages(
  objectName: string,
  concepts: Concept[],
  presetImages?: string[],
): ConceptImageState[] {
  const [images, setImages] = useState<ConceptImageState[]>(() =>
    concepts.map((_, index) => {
      const src = presetImages?.[index];
      return src ? { status: "ready", src } : { status: "pending" };
    }),
  );

  useEffect(() => {
    if (presetImages) return;
    const controller = new AbortController();
    const update = (index: number, state: ConceptImageState) => {
      if (controller.signal.aborted) return;
      setImages((current) =>
        current.map((image, i) => (i === index ? state : image)),
      );
    };

    // Success and failure are handled per request, so a slow or failed image
    // never holds back another card or reaches the page.
    concepts.forEach((concept, index) => {
      requestImage(
        {
          prompt: concept.image_prompt,
          objectName,
          seed: conceptSeed(objectName, index),
        },
        controller.signal,
      ).then(
        (src) => update(index, { status: "ready", src }),
        () => update(index, { status: "failed" }),
      );
    });

    return () => controller.abort();
  }, [objectName, concepts, presetImages]);

  return images;
}
