"use client";

import Image from "next/image";
import { useSearchParams } from "next/navigation";
import { DEMO_SAMPLES, isDemoRequested, type DemoSample } from "@/lib/demo";

type DemoSamplesProps = {
  enabled: boolean;
  onChoose: (sample: DemoSample) => void;
};

export function DemoSamples({ enabled, onChoose }: DemoSamplesProps) {
  const params = useSearchParams();
  if (!enabled && !isDemoRequested(params)) return null;

  return (
    <section aria-labelledby="samples-heading" className="mb-8">
      <h2 id="samples-heading" className="text-sm font-medium text-muted">
        Try a sample
      </h2>
      <ul className="mt-3 grid grid-cols-3 gap-3 sm:grid-cols-4">
        {DEMO_SAMPLES.map((sample) => (
          <li key={sample.id}>
            <button
              type="button"
              onClick={() => onChoose(sample)}
              className="flex w-full flex-col overflow-hidden rounded-md border border-line bg-white text-left hover:border-accent"
            >
              <Image
                src={sample.photoSrc}
                alt=""
                width={320}
                height={320}
                unoptimized
                className="aspect-square w-full object-cover"
              />
              <span className="p-2 text-sm">{sample.label}</span>
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}
