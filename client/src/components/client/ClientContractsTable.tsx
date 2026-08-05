import ClientStageBadge from "./ClientStageBadge.js";
import EmptyState from "../ui/EmptyState.js";
import { ChevronRightIcon, InboxIcon } from "../attorney/icons.js";
import { formatShortDate } from "../../utils/format.js";
import { REVIEW_COMPLETE_STATUSES } from "../../types/contract.js";
import type { ClientContractSummary } from "../../types/contract.js";

interface ClientContractsTableProps {
  contracts: ClientContractSummary[];
  onTrackContract: (contractId: string) => void;
  onViewReport: (contractId: string) => void;
}

/**
 * The client's "My contracts" list (Fig. 3.29): title + request number,
 * upload date, stage, and a row action that switches between "Track"
 * (review still in progress) and "View report" (attorney review is
 * done) depending on the contract's status.
 */
function ClientContractsTable({
  contracts,
  onTrackContract,
  onViewReport,
}: ClientContractsTableProps) {
  if (contracts.length === 0) {
    return (
      <div className="rounded-xl border border-hairline bg-white">
        <EmptyState
          icon={<InboxIcon className="h-6 w-6" />}
          title="No contracts submitted yet"
          description="Contracts you submit for attorney review will show up here, along with their review status."
        />
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-hairline bg-white">
      <table className="w-full text-left">
        <thead>
          <tr className="border-b border-hairline bg-parchment-50 text-xs font-medium tracking-wide text-ink-400 uppercase">
            <th className="px-4 py-3">Contract</th>
            <th className="px-3 py-3">Uploaded</th>
            <th className="px-3 py-3">Stage</th>
            <th className="px-3 py-3" />
          </tr>
        </thead>
        <tbody>
          {contracts.map((contract) => {
            const isComplete = REVIEW_COMPLETE_STATUSES.includes(
              contract.status,
            );

            return (
              <tr
                key={contract.id}
                className="border-b border-hairline last:border-b-0 hover:bg-navy-900/[0.02]"
              >
                <td className="max-w-xs px-4 py-3.5">
                  <p className="text-sm font-medium text-ink-900">
                    {contract.title}
                  </p>
                  <p className="mt-0.5 text-xs text-ink-400">
                    Request #{contract.requestNumber}
                  </p>
                </td>
                <td className="px-3 py-3.5 text-sm whitespace-nowrap text-ink-600">
                  {formatShortDate(contract.uploadedAt)}
                </td>
                <td className="px-3 py-3.5">
                  <ClientStageBadge status={contract.status} />
                </td>
                <td className="px-3 py-3.5 text-right whitespace-nowrap">
                  <button
                    type="button"
                    onClick={() =>
                      isComplete
                        ? onViewReport(contract.id)
                        : onTrackContract(contract.id)
                    }
                    className="inline-flex items-center gap-0.5 text-sm font-medium text-maroon-600 hover:text-maroon-700"
                  >
                    {isComplete ? "View report" : "Track"}
                    <ChevronRightIcon className="h-4 w-4" />
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export default ClientContractsTable;