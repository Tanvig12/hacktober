import type { Concept } from "@/types/analysis";
import { ConceptCard } from "./ConceptCard";

type ReuseIdeasProps = {
  concepts: Concept[];
  blocked: boolean;
};

export function ReuseIdeas({ concepts, blocked }: ReuseIdeasProps) {
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
      ) : (
        <div className="mt-5 grid gap-6 md:grid-cols-3">
          {concepts.map((concept, index) => (
            <ConceptCard key={index} concept={concept} imageSrc={null} />
          ))}
        </div>
      )}
    </section>
  );
}
