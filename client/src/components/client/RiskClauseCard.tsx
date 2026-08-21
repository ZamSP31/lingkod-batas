import type { ContractClause } from "../../types/clause.js";
import { ClauseRiskBadge } from "../ui/StatusBadge.js";

interface RiskClauseCardProps {
  clause: ContractClause;
}

/** A single clause's risk finding, as shown on the client's contract report. */
function RiskClauseCard({ clause }: RiskClauseCardProps) {
  const bodyText = clause.flagReason ?? clause.quotedText;

  return (
    <div className="rounded-xl border border-hairline bg-white p-4">
      <div className="mb-1.5 flex items-center gap-2.5">
        <ClauseRiskBadge level={clause.riskLevel} />
        <h3 className="text-sm font-semibold text-ink-900">
          {clause.title} · Clause {clause.clauseNumber}
        </h3>
      </div>
      <p className="text-sm leading-relaxed text-ink-600">{bodyText}</p>
      {clause.legalBasis && (
        <p className="mt-1.5 text-xs text-ink-400">
          Legal basis: {clause.legalBasis.citation} — {clause.legalBasis.explanation}
        </p>
      )}
    </div>
  );
}

export default RiskClauseCard;