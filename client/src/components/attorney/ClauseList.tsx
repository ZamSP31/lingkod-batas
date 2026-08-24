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
 * Modern clause selector list on the left side of the Review Queue.
 * Formatted with clean typography, clear risk tags, and subtle review status badges.
 */
function ClauseList({
  clauses,
  selectedClauseId,
  onSelectClause,
}: ClauseListProps) {
  return (
    <div className="overflow-hidden rounded-[8px] border border-line bg-white shadow-2xs">
      <ul className="divide-y divide-line">
        {clauses.map((clause) => {
          const isSelected = clause.id === selectedClauseId;
          const risk = RISK_MAP[clause.riskLevel] || RISK_MAP.low;
          const isReviewed =
            clause.attorneyStatus === "approved" ||
            clause.attorneyStatus === "overridden";

          return (
            <li key={clause.id}>
              <button
                type="button"
                onClick={() => onSelectClause(clause.id)}
                aria-current={isSelected}
                className={`flex w-full items-start justify-between gap-3 border-l-[3px] px-4 py-3.5 text-left transition-colors cursor-pointer ${
                  isSelected
                    ? "border-l-maroon bg-maroon/[0.04]"
                    : "border-l-transparent hover:bg-parchment/60"
                }`}
              >
                <div className="min-w-0 flex-1">
                  {/* Clause Title */}
                  <div className="text-[13.5px] font-semibold text-ink leading-snug line-clamp-1">
                    {clause.title}
                  </div>

                  {/* Subtitle with Clause Number and Review Status Tag */}
                  <div className="mt-1 flex flex-wrap items-center gap-1.5 font-mono text-[11px] text-ink-soft">
                    <span>Clause {clause.clauseNumber}</span>

                    {isReviewed && (
                      <>
                        <span className="text-line">•</span>
                        <span
                          className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                            clause.attorneyStatus === "approved"
                              ? "bg-green/10 text-green"
                              : "bg-navy/8 text-navy"
                          }`}
                        >
                          <svg
                            className="h-2.5 w-2.5 stroke-current"
                            viewBox="0 0 12 12"
                            fill="none"
                            strokeWidth="2.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <polyline points="2.5 6 4.5 8 9.5 3" />
                          </svg>
                          {clause.attorneyStatus === "approved"
                            ? "Reviewed"
                            : "Overridden"}
                        </span>
                      </>
                    )}
                  </div>
                </div>

                {/* Risk Level Badge */}
                <div
                  className={`mt-0.5 flex items-center gap-1.5 font-mono text-[10.5px] font-semibold tracking-wider uppercase shrink-0 ${risk.textClass}`}
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
