import ClauseRiskDot from "./ClauseRiskDot.js";
import type { ContractClause } from "../../types/clause.js";

interface ClauseListProps {
  clauses: ContractClause[];
  selectedClauseId: string;
  onSelectClause: (clauseId: string) => void;
}

/**
 * The clause-by-clause list on the left of the Review Queue (Fig.
 * 3.26). Purely a selector — the AI detail (quote, rationale, legal
 * basis) for whichever clause is selected renders in ClauseDetailPanel
 * alongside it, so the attorney can move through a contract without
 * losing the list.
 */
function ClauseList({
  clauses,
  selectedClauseId,
  onSelectClause,
}: ClauseListProps) {
  return (
    <div className="overflow-hidden rounded-xl border border-hairline bg-white">
      <ul>
        {clauses.map((clause) => {
          const isSelected = clause.id === selectedClauseId;
          return (
            <li
              key={clause.id}
              className="border-b border-hairline last:border-b-0"
            >
              <button
                type="button"
                onClick={() => onSelectClause(clause.id)}
                aria-current={isSelected}
                className={`flex w-full items-center justify-between gap-3 px-4 py-3.5 text-left transition-colors ${
                  isSelected
                    ? "bg-navy-900/[0.04] ring-1 ring-inset ring-navy-800"
                    : "hover:bg-parchment-100"
                }`}
              >
                <span>
                  <span className="block text-sm font-medium text-ink-900">
                    {clause.title}
                  </span>
                  <span className="mt-0.5 block text-xs text-ink-400">
                    Clause {clause.clauseNumber}
                  </span>
                </span>
                <ClauseRiskDot riskLevel={clause.riskLevel} />
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

export default ClauseList;
