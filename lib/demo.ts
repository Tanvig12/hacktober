import type { Dispatch } from "react";
import brokenLaptop from "@/fixtures/demo/broken-laptop.json";
import brokenUmbrella from "@/fixtures/demo/broken-umbrella.json";
import carTyre from "@/fixtures/demo/car-tyre.json";
import cardboardBox from "@/fixtures/demo/cardboard-box.json";
import denimJeans from "@/fixtures/demo/denim-jeans.json";
import glassBottle from "@/fixtures/demo/glass-bottle.json";
import paintTin from "@/fixtures/demo/paint-tin.json";
import petBottle from "@/fixtures/demo/pet-bottle.json";
import rustyBicycle from "@/fixtures/demo/rusty-bicycle.json";
import smartphone from "@/fixtures/demo/smartphone.json";
import woodenPallet from "@/fixtures/demo/wooden-pallet.json";
import { GatedAnalysisSchema } from "@/lib/ai/schema";
import type { CaptureAction } from "@/lib/capture";
import { resizeImage, type ResizedImage } from "@/lib/resize";
import type { Analysis } from "@/types/analysis";

export const DEMO_DELAY_MS = 2_500;

export type DemoSample = {
  id: string;
  label: string;
  photoSrc: string;
  analysis: Analysis;
  images: string[];
};

function sample(id: string, label: string, fixture: unknown): DemoSample {
  const analysis = GatedAnalysisSchema.parse(fixture);
  return {
    id,
    label,
    photoSrc: `/demo/${id}.jpg`,
    analysis,
    images: analysis.concepts.map((_, index) => `/demo/${id}-${index}.jpg`),
  };
}

export const DEMO_SAMPLES: DemoSample[] = [
  sample("pet-bottle", "Plastic water bottle", petBottle),
  sample("denim-jeans", "Worn denim jeans", denimJeans),
  sample("smartphone", "Phone with a swollen battery", smartphone),
  sample("car-tyre", "Old car tyre", carTyre),
  sample("glass-bottle", "Empty glass bottle", glassBottle),
  sample("wooden-pallet", "Wooden pallet", woodenPallet),
  sample("cardboard-box", "Cardboard box", cardboardBox),
  sample("broken-umbrella", "Broken umbrella", brokenUmbrella),
  sample("rusty-bicycle", "Rusty bicycle", rustyBicycle),
  sample("broken-laptop", "Laptop with a smashed screen", brokenLaptop),
  sample("paint-tin", "Old paint tin", paintTin),
];

export const FALLBACK_SAMPLE = DEMO_SAMPLES[0];

export function isDemoRequested(params: {
  get(name: string): string | null;
}): boolean {
  return params.get("demo") === "1";
}

async function loadPhoto(sample: DemoSample): Promise<ResizedImage> {
  const blob = await (await fetch(sample.photoSrc)).blob();
  return resizeImage(new File([blob], `${sample.id}.jpg`, { type: blob.type }));
}

// Runs a sample through the same states as a real analysis, using only
// bundled fixtures and files from public/demo, so nothing reaches an API.
export async function playSample(
  sample: DemoSample,
  dispatch: Dispatch<CaptureAction>,
  delayMs = DEMO_DELAY_MS,
): Promise<void> {
  dispatch({ type: "select", photo: await loadPhoto(sample) });
  dispatch({ type: "analyze" });
  await new Promise((resolve) => setTimeout(resolve, delayMs));
  dispatch({
    type: "succeed",
    analysis: sample.analysis,
    images: sample.images,
  });
}
