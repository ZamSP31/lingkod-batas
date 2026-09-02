import type { ContractClause } from "../../types/clause.js";

interface RiskClauseCardProps {
  clause: ContractClause;
}

/**
 * Finding card for client report matching Screen 7 of the mockup.
 * Renders an anchor card for high-risk findings, and a card for moderate/clear findings,
 * highlighting attorney notes, statutory legal bases, and optimized for PDF print.
 */
function RiskClauseCard({ clause }: RiskClauseCardProps) {
  const isHighRisk = clause.riskLevel === "high";

  if (isHighRisk) {
    return (
      <div className="print-avoid-break rounded-[8px] border border-line bg-white p-6 sm:p-7 shadow-2xs print:border-gray-300 print:p-5 print:my-4 print:shadow-none">
        {/* Badges */}
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2.5">
          <div className="flex items-center gap-2">
            <span className="rounded-full bg-maroon/[0.09] px-3 py-1 font-mono text-[10.5px] font-bold tracking-[0.04em] text-maroon uppercase print:border print:border-maroon print:bg-transparent">
              High-risk
            </span>
            <span className="rounded-full bg-parchment px-3 py-1 font-mono text-[10.5px] font-medium tracking-[0.04em] text-ink-soft uppercase print:border print:border-gray-300 print:bg-transparent">
              {clause.title} · Clause {clause.clauseNumber}
            </span>
          </div>
          {clause.legalBasis?.citation && (
            <span className="font-mono text-[11px] font-semibold text-navy print:text-black">
              {clause.legalBasis.citation}
            </span>
          )}
        </div>

        {/* Quoted Clause Box */}
        <div className="mb-4 rounded-r-[6px] border-l-[3px] border-maroon bg-parchment p-4 print:bg-gray-50 print:border-l-[4px]">
          <span className="mb-1 block font-mono text-[10px] font-semibold text-maroon uppercase">
            Verbatim Contract Provision:
          </span>
          <p className="font-serif text-[14px] italic leading-[1.65] text-navy-deep m-0 whitespace-pre-wrap print:text-black">
            "{clause.quotedText}"
          </p>
        </div>

        {/* Why this was flagged */}
        {clause.flagReason && (
          <div className="mb-4">
            <span className="mb-1 block font-mono text-[10.5px] font-semibold tracking-[0.05em] text-maroon uppercase">
              Statutory Conflict Analysis
            </span>
            <p className="text-[13.5px] leading-[1.6] text-[#3a352d] m-0 print:text-black">
              {clause.flagReason}
            </p>
          </div>
        )}

        {/* Legal basis */}
        {clause.legalBasis && (
          <div className="mb-4">
            <span className="mb-1 block font-mono text-[10.5px] font-semibold tracking-[0.05em] text-navy uppercase">
              Applicable Philippine Statutory Basis
            </span>
            <div className="flex flex-col gap-1 rounded-[6px] bg-navy/[0.04] p-3.5 print:bg-gray-50 print:border print:border-gray-200">
              <span className="font-mono text-[11.5px] font-bold text-navy print:text-black">
                {clause.legalBasis.citation}
              </span>
              <p className="text-[13px] leading-[1.55] text-[#3a352d] m-0 print:text-black">
                {clause.legalBasis.explanation}
              </p>
            </div>
          </div>
        )}

        {/* Attorney Guidance & Note */}
        {clause.attorneyNote && (
          <div className="rounded-[6px] border border-gold/40 bg-gold/[0.06] p-4 print:border-gray-400 print:bg-gray-100">
            <span className="mb-1 flex items-center gap-1.5 font-mono text-[10.5px] font-bold text-navy uppercase print:text-black">
              <span>✍️</span> Attorney Jimenez's Advice &amp; Renegotiation Note
            </span>
            <p className="text-[13px] leading-[1.55] text-ink m-0 font-sans font-medium print:text-black">
              {clause.attorneyNote}
            </p>
          </div>
        )}
      </div>
    );
  }

  // Moderate / low-risk card
  return (
    <div className="print-avoid-break rounded-[8px] border border-line bg-white p-5 shadow-2xs print:border-gray-300 print:my-3 print:shadow-none">
      <div className="mb-2.5 flex items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <span
            className={`rounded-full px-2.5 py-0.5 font-mono text-[10px] font-bold tracking-[0.04em] uppercase print:border ${
              clause.riskLevel === "medium"
                ? "bg-gold/15 text-gold print:border-yellow-700 print:text-black"
                : "bg-green/15 text-green print:border-green-700 print:text-black"
            }`}
          >
            {clause.riskLevel === "medium" ? "Moderate Risk" : "Statutory Compliant / Clear"}
          </span>
          <span className="rounded-full bg-parchment px-2.5 py-0.5 font-mono text-[10px] font-medium tracking-[0.04em] text-ink-soft uppercase print:border print:border-gray-300 print:bg-transparent">
            {clause.title} · Clause {clause.clauseNumber}
          </span>
        </div>
        {clause.legalBasis?.citation && (
          <span className="font-mono text-[11px] font-semibold text-ink-soft shrink-0 print:text-black">
            {clause.legalBasis.citation}
          </span>
        )}
      </div>

      <div className="mb-2.5 rounded-[4px] bg-parchment/60 p-3 text-[13px] italic text-navy-deep font-serif print:bg-gray-50 print:text-black">
        "{clause.quotedText}"
      </div>

      <p className="text-[13px] leading-[1.55] text-[#3a352d] m-0 print:text-black">
        <b className="font-semibold text-ink print:text-black">
          {clause.flagReason ? `${clause.title}: ` : "Analysis: "}
        </b>
        {clause.flagReason ?? "Provision is consistent with Philippine statutory minimums."}
      </p>

      {/* Attorney Guidance & Note (if added) */}
      {clause.attorneyNote && (
        <div className="mt-3 rounded-[6px] border border-gold/40 bg-gold/[0.06] p-3 print:border-gray-400 print:bg-gray-100">
          <span className="mb-0.5 flex items-center gap-1.5 font-mono text-[10px] font-bold text-navy uppercase print:text-black">
            <span>✍️</span> Attorney Advice
          </span>
          <p className="text-[12.5px] leading-[1.5] text-ink m-0 font-sans print:text-black">
            {clause.attorneyNote}
          </p>
        </div>
      )}
    </div>
  );
}

export default RiskClauseCard;