import type { ContractClause } from "../../types/clause.js";

interface ClauseListProps {
  clauses: ContractClause[];
  selectedClauseId: string;
  onSelectClause: (clauseId: string) => void;
}

const RISK_MAP = {
  high: { label: "High", textClass: "text-maroon", dotClass: "bg-maroon" },
  medium: { label: "Medium", textClass: "text-gold", dotClass: "bg-gold" },
  low: { label: "Clear", textClass: "text-green", dotClass: "bg-green" },
};

/**
 * Clause index selector on the left of Review Queue, matching Screen 5.
 */
function ClauseList({
  clauses,
  selectedClauseId,
  onSelectClause,
}: ClauseListProps) {
  return (
    <div className="overflow-hidden rounded-lg[8px] border border-line bg-white shadow-2xs">
      <ul className="divide-y divide-line">
        {clauses.map((clause) => {
          const isSelected = clause.id === selectedClauseId;
          const risk = RISK_MAP[clause.riskLevel];

          return (
            <li key={clause.id}>
              <button
                type="button"
                onClick={() => onSelectClause(clause.id)}
                aria-current={isSelected}
                className={`flex w-full items-center justify-between border-l-[3px] px-[18px] py-4 text-left transition-colors cursor-pointer ${
                  isSelected
                    ? "border-l-maroon bg-maroon/5"
                    : "border-l-transparent hover:bg-parchment/60"
                }`}
              >
                <div>
                  <div className="text-[14px] font-semibold text-ink mb-0.5">
                    {clause.title}
                  </div>
                  <div className="font-mono text-[11px] text-ink-soft">
                    Clause {clause.clauseNumber}
                  </div>
                </div>
                <div
                  className={`flex items-center gap-1.5 font-mono text-[10px] font-medium tracking-[0.03em] uppercase shrink-0 ${risk.textClass}`}
                >
                  <span
                    className={`h-[7px] w-[7px] rounded-full ${risk.dotClass}`}
                  />
                  {risk.label}
                </div>
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

export default ClauseList;
