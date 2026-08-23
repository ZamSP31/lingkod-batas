import type { ContractClause } from "../../types/clause.js";

interface RiskClauseCardProps {
  clause: ContractClause;
}

/**
 * Finding card for client report matching Screen 7 of the mockup.
 * Renders an anchor card for high-risk findings, and a compact card for moderate/low-risk findings.
 */
function RiskClauseCard({ clause }: RiskClauseCardProps) {
  const isHighRisk = clause.riskLevel === "high";

  if (isHighRisk) {
    return (
      <div className="rounded-[8px] border border-line bg-white p-7 sm:p-8 shadow-2xs">
        {/* Badges */}
        <div className="mb-5.5 flex flex-wrap items-center gap-2.5">
          <span className="rounded-full bg-maroon/[0.09] px-3 py-1 font-mono text-[10.5px] font-medium tracking-[0.04em] text-maroon uppercase">
            High-risk
          </span>
          <span className="rounded-full bg-parchment px-3 py-1 font-mono text-[10.5px] font-medium tracking-[0.04em] text-ink-soft uppercase">
            {clause.title} · Clause {clause.clauseNumber}
          </span>
        </div>

        {/* Quoted Clause Box */}
        <div className="mb-5.5 rounded-r-[6px] border-l-[3px] border-maroon bg-parchment p-4.5">
          <p className="font-serif text-[15.5px] italic leading-[1.7] text-navy-deep m-0">
            "{clause.quotedText}"
          </p>
        </div>

        {/* Why this was flagged */}
        {clause.flagReason && (
          <div className="mb-5">
            <span className="mb-1.5 block font-mono text-[11px] font-semibold tracking-[0.06em] text-maroon uppercase">
              Why this was flagged
            </span>
            <p className="text-[14px] leading-[1.65] text-[#3a352d] m-0">
              {clause.flagReason}
            </p>
          </div>
        )}

        {/* Legal basis */}
        {clause.legalBasis && (
          <div>
            <span className="mb-1.5 block font-mono text-[11px] font-semibold tracking-[0.06em] text-navy uppercase">
              Legal basis
            </span>
            <div className="flex flex-col gap-1 rounded-[6px] bg-navy/[0.04] p-4">
              <span className="font-mono text-[12px] font-semibold text-navy">
                {clause.legalBasis.citation}
              </span>
              <p className="text-[13.5px] leading-[1.6] text-[#3a352d] m-0">
                {clause.legalBasis.explanation}
              </p>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Compact finding for moderate / low-risk
  return (
    <div className="rounded-[8px] border border-line bg-white p-5 shadow-2xs">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <span
            className={`rounded-full px-2.5 py-0.5 font-mono text-[10px] font-medium tracking-[0.04em] uppercase ${
              clause.riskLevel === "medium"
                ? "bg-gold/15 text-gold"
                : "bg-green/15 text-green"
            }`}
          >
            {clause.riskLevel === "medium" ? "Moderate" : "Low-risk"}
          </span>
          <span className="rounded-full bg-parchment px-2.5 py-0.5 font-mono text-[10px] font-medium tracking-[0.04em] text-ink-soft uppercase">
            {clause.title} · Clause {clause.clauseNumber}
          </span>
        </div>
        {clause.legalBasis?.citation && (
          <span className="font-mono text-[11.5px] text-ink-soft shrink-0">
            {clause.legalBasis.citation}
          </span>
        )}
      </div>

      <p className="text-[13.5px] leading-[1.6] text-[#3a352d] m-0">
        <b className="font-semibold text-ink">
          {clause.flagReason ? `${clause.title}: ` : "Standard clause. "}
        </b>
        {clause.flagReason ?? clause.quotedText}
      </p>
    </div>
  );
}

export default RiskClauseCard;