import { ACTION_LABEL, capitalize } from "@/lib/format";
import type { RecoveryStep } from "@/types/analysis";

type RecoveryPlanProps = {
  steps: RecoveryStep[];
};

const COLUMNS = ["Component", "Material", "Action", "Where it goes"];

export function RecoveryPlan({ steps }: RecoveryPlanProps) {
  return (
    <section
      id="recovery-plan"
      tabIndex={-1}
      aria-labelledby="recovery-heading"
      className="mt-14 scroll-mt-6"
    >
      <h3 id="recovery-heading" className="text-lg font-semibold">
        Recovery plan
      </h3>
      {steps.length === 0 ? (
        <p className="mt-3 text-muted">
          No recovery steps came back for this item.
        </p>
      ) : (
        <div
          tabIndex={0}
          role="region"
          aria-labelledby="recovery-heading"
          className="mt-4 overflow-x-auto rounded-md border border-line bg-white"
        >
          <table className="w-full min-w-[40rem] text-left">
            <caption className="px-4 pt-4 text-left text-sm text-muted">
              Where each part should go once you are done with it.
            </caption>
            <thead>
              <tr className="border-b border-line">
                {COLUMNS.map((column) => (
                  <th
                    key={column}
                    scope="col"
                    className="px-4 py-3 text-sm font-medium text-muted"
                  >
                    {column}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {steps.map((step, index) => (
                <tr key={index} className="border-b border-line last:border-0">
                  <td className="px-4 py-3 align-top">
                    {capitalize(step.component)}
                  </td>
                  <td className="px-4 py-3 align-top font-mono text-sm">
                    {step.material}
                  </td>
                  <td className="px-4 py-3 align-top">
                    <span
                      className={`inline-block rounded-sm border px-1.5 font-mono text-sm whitespace-nowrap ${
                        step.action === "hazardous-drop-off"
                          ? "border-danger text-danger"
                          : "border-line"
                      }`}
                    >
                      {ACTION_LABEL[step.action]}
                    </span>
                  </td>
                  <td className="px-4 py-3 align-top">{step.destination}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
