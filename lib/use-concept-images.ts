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

    // One request at a time: free image tiers allow roughly one image per window,
    // so parallel requests would mostly be refused. Each card still updates as
    // soon as its own image arrives, and a failure only affects that card.
    async function loadInOrder() {
      for (const [index, concept] of concepts.entries()) {
        if (controller.signal.aborted) return;
        try {
          const src = await requestImage(
            {
              prompt: concept.image_prompt,
              objectName,
              seed: conceptSeed(objectName, index),
            },
            controller.signal,
          );
          update(index, { status: "ready", src });
        } catch {
          update(index, { status: "failed" });
        }
      }
    }
    void loadInOrder();

    return () => controller.abort();
  }, [objectName, concepts, presetImages]);

  return images;
}
