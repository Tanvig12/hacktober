"use client";

import { useState } from "react";
import type { ConceptImageState } from "@/lib/use-concept-images";

const IMAGE_SIZE = 768;

type ConceptImageProps = {
  image: ConceptImageState;
  alt: string;
  fallbackLabel: string;
};

export function ConceptImage({ image, alt, fallbackLabel }: ConceptImageProps) {
  const [loaded, setLoaded] = useState(false);
  const [broken, setBroken] = useState(false);

  if (image.status === "failed" || broken) {
    return (
      <div
        aria-hidden
        className="flex aspect-square items-center justify-center border-b border-line bg-paper font-mono text-sm text-muted"
      >
        {fallbackLabel}
      </div>
    );
  }

  return (
    <div className="relative aspect-square border-b border-line bg-paper">
      {!loaded && (
        <div
          aria-hidden
          className="absolute inset-0 animate-pulse bg-line/50 motion-reduce:animate-none"
        />
      )}
      {image.status === "ready" && (
        // eslint-disable-next-line @next/next/no-img-element -- remote and data URLs skip the image optimizer
        <img
          src={image.src}
          alt={alt}
          width={IMAGE_SIZE}
          height={IMAGE_SIZE}
          loading="lazy"
          onLoad={() => setLoaded(true)}
          onError={() => setBroken(true)}
          className={`absolute inset-0 size-full object-cover transition-opacity ${
            loaded ? "opacity-100" : "opacity-0"
          }`}
        />
      )}
    </div>
  );
}
