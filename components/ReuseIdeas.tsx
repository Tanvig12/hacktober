import type { Concept } from "@/types/analysis";
import { ConceptGrid } from "./ConceptGrid";

type ReuseIdeasProps = {
  objectName: string;
  concepts: Concept[];
  blocked: boolean;
  presetImages?: string[];
};

export function ReuseIdeas({
  objectName,
  concepts,
  blocked,
  presetImages,
}: ReuseIdeasProps) {
  return (
    <section aria-labelledby="reuse-heading" className="mt-14">
      <h3 id="reuse-heading" className="text-lg font-semibold">
        Ways to reuse it
      </h3>
      {blocked ? (
        <p className="mt-3 max-w-2xl text-muted">
          DIY reuse isn&rsquo;t safe for this item, so no reuse ideas are shown.
          Follow the recovery plan below.
        </p>
      ) : concepts.length === 0 ? (
        <p className="mt-3 max-w-2xl text-muted">
          This item is too contaminated for the reuse ideas we found. Follow the
          recovery plan below.
        </p>
      ) : (
        <ConceptGrid
          objectName={objectName}
          concepts={concepts}
          presetImages={presetImages}
        />
      )}
    </section>
  );
}
