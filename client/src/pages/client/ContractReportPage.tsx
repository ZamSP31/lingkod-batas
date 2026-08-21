import { useParams, Link } from "react-router-dom";
import RiskClauseCard from "../../components/client/RiskClauseCard.js";
import StatusBadge from "../../components/ui/StatusBadge.js";
import {
  mockClientContracts,
  mockClientContractReports,
} from "../../mocks/contracts.js";

function DownloadIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 20 20" fill="none" className={className} aria-hidden="true">
      <path
        d="M10 3v9m0 0-3.5-3.5M10 12l3.5-3.5M4 14v1.5a1.5 1.5 0 0 0 1.5 1.5h9a1.5 1.5 0 0 0 1.5-1.5V14"
        stroke="currentColor"
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/**
 * The client's finalized, clause-by-clause risk report for one contract.
 *
 * While the backend doesn't exist yet, this page is reachable two ways:
 *  - /client/contract-report/:contractId with a real id from
 *    mockClientContracts (e.g. "c-2002" or "c-2003")
 *  - /client/contract-report with no id at all, which falls back to the
 *    first available mock report — handy for just clicking a nav link
 *    during frontend dev instead of hunting for a valid id each time.
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
      <div className="mx-auto max-w-4xl">
        <p className="text-sm text-ink-400">
          Report not found.{" "}
          <Link to="/client" className="text-maroon-700 underline">
            Back to My Contracts
          </Link>
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl font-semibold text-ink-900">
              {contract.title}
            </h1>
            <StatusBadge status={contract.status} />
          </div>
          <p className="mt-1 text-sm text-ink-400">
            Reviewed by {report.reviewedByAttorney} · {report.reviewedDate}
          </p>
        </div>

        <button
          type="button"
          className="flex shrink-0 items-center gap-2 rounded-lg bg-navy-900 px-4 py-2.5 text-sm font-medium text-parchment-100 hover:bg-navy-900/90"
        >
          <DownloadIcon className="h-4 w-4" />
          Download PDF
        </button>
      </div>

      <div className="mt-6 flex flex-col gap-3">
        {report.clauses.map((clause) => (
          <RiskClauseCard key={clause.id} clause={clause} />
        ))}
      </div>

      <h2 className="mt-6 text-sm font-semibold text-ink-900">
        Attorney Comments
      </h2>
      <div className="mt-1.5 rounded-xl border border-hairline bg-white p-4">
        <p className="text-sm leading-relaxed text-ink-600">
          {report.attorneyComments}
        </p>
      </div>
    </div>
  );
}

export default ContractReportPage;