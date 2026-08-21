import type { ClauseRiskLevel, ContractClause } from "../../types/clause.js";

const RISK_BADGE: Record<
  ClauseRiskLevel,
  { label: string; className: string }
> = {
  high: { label: "High-risk", className: "bg-maroon-600/10 text-maroon-700" },
  medium: { label: "Medium-risk", className: "bg-amber-50 text-amber-700" },
  low: { label: "Low-risk", className: "bg-green-50 text-green-700" },
};

interface ClauseDetailPanelProps {
  clause: ContractClause;
}

/**
 * The AI's analysis of whichever clause is selected in ClauseList
 * (Fig. 3.26, right-hand panel): the risk badge, the verbatim quoted
 * text, the plain-language rationale ("Why this was flagged"), and the
 * statutory citation backing it ("Legal basis"). "low" risk clauses
 * skip the rationale/citation sections since the AI has nothing to
 * flag there.
 */
function ClauseDetailPanel({ clause }: ClauseDetailPanelProps) {
  const badge = RISK_BADGE[clause.riskLevel];
  const isFlagged =
    clause.riskLevel === "high" || clause.riskLevel === "medium";

  return (
    <div className="rounded-xl border border-hairline bg-white p-6">
      <div className="flex flex-wrap items-center gap-2">
        <span
          className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold whitespace-nowrap ${badge.className}`}
        >
          {badge.label}
        </span>
        <span className="inline-flex items-center rounded-full bg-parchment-100 px-2.5 py-1 text-xs font-medium whitespace-nowrap text-ink-600">
          {clause.title} · Clause {clause.clauseNumber}
        </span>
      </div>

      <blockquote className="mt-5 rounded-lg border-l-4 border-maroon-600/60 bg-maroon-600/[0.04] px-4 py-3.5 text-sm leading-relaxed text-ink-900 italic">
        "{clause.quotedText}"
      </blockquote>

      {isFlagged && clause.flagReason && (
        <div className="mt-6">
          <h3 className="text-xs font-semibold tracking-wide text-maroon-700 uppercase">
            Why this was flagged
          </h3>
          <p className="mt-2 text-sm leading-relaxed text-ink-600">
            {clause.flagReason}
          </p>
        </div>
      )}

      {isFlagged && clause.legalBasis && (
        <div className="mt-6">
          <h3 className="text-xs font-semibold tracking-wide text-ink-900 uppercase">
            Legal basis
          </h3>
          <p className="mt-2 text-sm font-medium text-navy-800">
            {clause.legalBasis.citation}
          </p>
          <p className="mt-1 text-sm leading-relaxed text-ink-600">
            {clause.legalBasis.explanation}
          </p>
        </div>
      )}

      {!isFlagged && (
        <p className="mt-6 text-sm text-ink-400">
          No issues flagged for this clause.
        </p>
      )}
    </div>
  );
}

export default ClauseDetailPanel;
