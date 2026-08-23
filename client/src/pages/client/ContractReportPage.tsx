import { useParams, Link } from "react-router-dom";
import RiskClauseCard from "../../components/client/RiskClauseCard.js";
import {
  mockClientContracts,
  mockClientContractReports,
} from "../../mocks/contracts.js";

/**
 * Client Contract Report page matching Screen 7 of the mockup.
 */
function ContractReportPage() {
  const { contractId } = useParams<{ contractId?: string }>();

  const fallbackReport = Object.values(mockClientContractReports)[0];
  const report = contractId
    ? mockClientContractReports[contractId]
    : fallbackReport;
  const contract = report
    ? mockClientContracts.find((c) => c.id === report.contractId)
    : undefined;

  if (!contract || !report) {
    return (
      <div className="max-w-[760px]">
        <p className="font-mono text-sm text-ink-soft">
          Report not found.{" "}
          <Link to="/client" className="text-maroon underline">
            Back to My contracts
          </Link>
        </p>
      </div>
    );
  }

  const highRiskCount = report.clauses.filter((c) => c.riskLevel === "high").length;
  const modRiskCount = report.clauses.filter((c) => c.riskLevel === "medium").length;
  const lowRiskCount = report.clauses.filter((c) => c.riskLevel === "low").length;

  return (
    <div className="max-w-[760px]">
      {/* Report Header */}
      <div className="mb-5.5 flex flex-wrap items-end justify-between gap-4 border-b border-line pb-6">
        <div>
          <span className="mb-2 block font-mono text-[11.5px] font-medium tracking-[0.06em] text-maroon uppercase">
            Request #{contract.requestNumber} · Contract report
          </span>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="font-serif text-[28px] font-medium tracking-[-0.01em] text-navy-deep m-0">
              {contract.title}
            </h1>
            <span className="inline-flex items-center gap-1.5 font-mono text-[11px] font-medium tracking-[0.03em] text-green uppercase">
              <span className="h-[7px] w-[7px] rounded-full bg-green" />
              Approved
            </span>
          </div>
          <div className="mt-2 font-mono text-[11px] tracking-[0.04em] text-ink-soft uppercase">
            Reviewed by {report.reviewedByAttorney} · {report.reviewedDate}
          </div>
        </div>

        <button
          type="button"
          className="flex items-center gap-2 rounded-[5px] bg-maroon px-5 py-[11px] text-[13.5px] font-semibold text-parchment transition-colors hover:bg-maroon-bright cursor-pointer"
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            className="h-3.5 w-3.5"
          >
            <path d="M12 3V15M12 15L7 10M12 15L17 10" />
            <path d="M4 17V19A2 2 0 006 21H18A2 2 0 0020 19V17" />
          </svg>
          Download PDF
        </button>
      </div>

      {/* Risk Tally Strip */}
      <div className="mb-6.5 flex flex-wrap items-center gap-4 text-[12.5px] text-ink-soft">
        <span className="flex items-center gap-1.5 font-mono text-xs">
          <span className="h-[7px] w-[7px] rounded-full bg-maroon" />
          {highRiskCount} high-risk
        </span>
        <span className="flex items-center gap-1.5 font-mono text-xs">
          <span className="h-[7px] w-[7px] rounded-full bg-gold" />
          {modRiskCount} moderate
        </span>
        <span className="flex items-center gap-1.5 font-mono text-xs">
          <span className="h-[7px] w-[7px] rounded-full bg-green" />
          {lowRiskCount} low-risk
        </span>
      </div>

      {/* Findings Container */}
      <div className="flex flex-col gap-4.5">
        {report.clauses.map((clause) => (
          <RiskClauseCard key={clause.id} clause={clause} />
        ))}

        {/* Attorney Comments Card */}
        <div className="rounded-[8px] border border-line bg-white p-7 sm:p-8 shadow-2xs">
          <div className="mb-4 flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gold text-xs font-bold text-navy-deep">
              JD
            </div>
            <div>
              <div className="text-[14px] font-semibold text-ink">
                {report.reviewedByAttorney}
              </div>
              <div className="font-mono text-[10.5px] tracking-[0.04em] text-ink-soft uppercase">
                Review completed · {report.reviewedDate}
              </div>
            </div>
          </div>
          <p className="font-serif text-[15px] italic leading-[1.7] text-[#3a352d] m-0">
            "{report.attorneyComments}"
          </p>
        </div>
      </div>
    </div>
  );
}

export default ContractReportPage;