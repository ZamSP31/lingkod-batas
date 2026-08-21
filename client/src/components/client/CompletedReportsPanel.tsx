import { DownloadIcon } from "../shared/icons.js";
import type { ClientContractSummary } from "../../types/contract.js";

interface CompletedReportsPanelProps {
  contracts: ClientContractSummary[];
  onDownload: (contractId: string) => void;
}

/**
 * "Completed reports" panel on the client dashboard (Fig. 3.29) — a
 * quick-access list of finalized reports, separate from the main table
 * since a client with a long contract history will want these
 * surfaced without scrolling/filtering the full list.
 */
function CompletedReportsPanel({
  contracts,
  onDownload,
}: CompletedReportsPanelProps) {
  return (
    <div>
      <h2 className="mb-2 text-sm font-semibold text-ink-900">
        Completed Reports
      </h2>

      <div className="rounded-xl border border-hairline bg-white">
        {contracts.length === 0 ? (
          <p className="px-5 py-8 text-center text-sm text-ink-400">
            No finalized reports yet.
          </p>
        ) : (
          <ul>
            {contracts.map((contract) => (
              <li
                key={contract.id}
                className="flex items-center justify-between gap-3 border-b border-hairline px-5 py-3.5 last:border-b-0"
              >
                <p className="min-w-0 truncate text-sm text-ink-900">
                  {contract.title}
                </p>
                <button
                  type="button"
                  onClick={() => onDownload(contract.id)}
                  className="inline-flex shrink-0 items-center gap-1.5 text-sm font-medium text-maroon-600 hover:text-maroon-700"
                >
                  <DownloadIcon className="h-4 w-4" />
                  Download PDF
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

export default CompletedReportsPanel;