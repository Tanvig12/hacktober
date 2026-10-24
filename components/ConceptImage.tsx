"use client";

import Image from "next/image";
import { useState } from "react";

type ConceptImageProps = {
  src: string | null;
  alt: string;
  fallbackLabel: string;
};

export function ConceptImage({ src, alt, fallbackLabel }: ConceptImageProps) {
  const [status, setStatus] = useState<"loading" | "loaded" | "failed">(
    "loading",
  );

  if (!src || status === "failed") {
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
      {status === "loading" && (
        <div
          aria-hidden
          className="absolute inset-0 animate-pulse bg-line/50 motion-reduce:animate-none"
        />
      )}
      <Image
        src={src}
        alt={alt}
        fill
        unoptimized
        sizes="(min-width: 768px) 33vw, 100vw"
        onLoad={() => setStatus("loaded")}
        onError={() => setStatus("failed")}
        className={`object-cover transition-opacity ${
          status === "loaded" ? "opacity-100" : "opacity-0"
        }`}
      />
    </div>
  );
}
