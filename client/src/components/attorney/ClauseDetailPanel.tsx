import { useState } from "react";
import type { ContractClause } from "../../types/clause.js";

interface ClauseDetailPanelProps {
  clause: ContractClause;
}

/**
 * Clause Detail Panel matching Screen 5 (Review Queue detail card).
 */
function ClauseDetailPanel({ clause }: ClauseDetailPanelProps) {
  const [actionStatus, setActionStatus] = useState<string | null>(null);
  const isFlagged =
    clause.riskLevel === "high" || clause.riskLevel === "medium";

  return (
    <div className="rounded-lg[8px] border border-line bg-white p-8 shadow-2xs">
      {/* Badges */}
      <div className="mb-5.5 flex flex-wrap items-center gap-2.5">
        <span
          className={`rounded-full px-3 py-1 font-mono text-[10.5px] font-medium tracking-[0.04em] uppercase ${
            clause.riskLevel === "high"
              ? "bg-maroon/9 text-maroon"
              : clause.riskLevel === "medium"
                ? "bg-gold/15 text-gold"
                : "bg-green/15 text-green"
          }`}
        >
          {clause.riskLevel === "high"
            ? "High-risk"
            : clause.riskLevel === "medium"
              ? "Medium-risk"
              : "Clear"}
        </span>
        <span className="rounded-full bg-parchment px-3 py-1 font-mono text-[10.5px] font-medium tracking-[0.04em] uppercase text-ink-soft">
          {clause.title} · Clause {clause.clauseNumber}
        </span>
      </div>

      {/* Quoted Clause Box */}
      <div className="mb-6.5 rounded-r-md[6px] border-l-[3px] border-maroon bg-parchment p-5">
        <p className="font-serif text-[16.5px] italic leading-[1.7] text-navy-deep">
          "{clause.quotedText}"
        </p>
      </div>

      {/* Analysis: Why Flagged */}
      {isFlagged && clause.flagReason && (
        <div className="mb-5.5">
          <span className="mb-2 block font-mono text-[11px] font-semibold tracking-[0.06em] text-maroon uppercase">
            Why this was flagged
          </span>
          <p className="text-[14.5px] leading-[1.7] text-[#3a352d]">
            {clause.flagReason}
          </p>
        </div>
      )}

      {/* Analysis: Legal Basis */}
      {isFlagged && clause.legalBasis && (
        <div className="mb-5.5">
          <span className="mb-2 block font-mono text-[11px] font-semibold tracking-[0.06em] text-navy uppercase">
            Legal basis
          </span>
          <div className="flex flex-col gap-1 rounded-md[6px] bg-navy/4 p-4.5">
            <span className="font-mono text-[12.5px] font-semibold text-navy">
              {clause.legalBasis.citation}
            </span>
            <p className="text-[14.5px] leading-[1.7] text-[#3a352d] m-0">
              {clause.legalBasis.explanation}
            </p>
          </div>
        </div>
      )}

      {!isFlagged && (
        <div className="mb-5.5 text-[14px] text-ink-soft">
          No legal conflicts or high-risk issues were flagged by the AI for this
          clause.
        </div>
      )}

      {/* Actions */}
      <div className="mt-7 flex flex-wrap items-center gap-3 border-t border-dashed border-line pt-5.5">
        <button
          type="button"
          onClick={() => setActionStatus("approved")}
          className="rounded-[5px] bg-maroon px-5 py-2.5 text-[13.5px] font-semibold text-parchment transition-colors hover:bg-maroon-bright cursor-pointer"
        >
          Approve clause
        </button>
        <button
          type="button"
          onClick={() => setActionStatus("overridden")}
          className="rounded-[5px] border border-line bg-transparent px-5 py-2.5 text-[13.5px] font-semibold text-ink transition-colors hover:border-ink cursor-pointer"
        >
          Override flag
        </button>
        <button
          type="button"
          onClick={() => setActionStatus("editing")}
          className="ml-auto bg-transparent text-[13.5px] font-medium text-ink-soft hover:text-ink cursor-pointer"
        >
          Edit note →
        </button>
      </div>

      {actionStatus && (
        <div className="mt-3 font-mono text-xs text-maroon">
          Action recorded ({actionStatus}).
        </div>
      )}
    </div>
  );
}

export default ClauseDetailPanel;
