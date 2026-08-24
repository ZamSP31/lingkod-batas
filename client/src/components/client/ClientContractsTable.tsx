import ClientStageBadge from "./ClientStageBadge.js";
import EmptyState from "../ui/EmptyState.js";
import { InboxIcon } from "../attorney/icons.js";
import { formatShortDate } from "../../utils/format.js";
import { REVIEW_COMPLETE_STATUSES } from "../../types/contract.js";
import type { ClientContractSummary } from "../../types/contract.js";

interface ClientContractsTableProps {
  contracts: ClientContractSummary[];
  onTrackContract: (contractId: string) => void;
  onViewReport: (contractId: string) => void;
}

/**
 * The client's "My contracts" list matching Screen 8 of the mockup:
 * title + request number, upload date in mono, stage tag with dot + label,
 * and maroon action link ("Track →" / "View report →").
 */
function ClientContractsTable({
  contracts,
  onTrackContract,
  onViewReport,
}: ClientContractsTableProps) {
  if (contracts.length === 0) {
    return (
      <div className="rounded-[8px] border border-line bg-white mt-6">
        <EmptyState
          icon={<InboxIcon className="h-6 w-6" />}
          title="No contracts submitted yet"
          description="Contracts you submit for attorney review will show up here, along with their review status."
        />
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-[8px] border border-line bg-white shadow-2xs mt-6.5">
      <table className="w-full border-collapse text-left">
        <thead>
          <tr className="border-b-2 border-line bg-[#ECE5D6] font-mono text-[11px] font-bold tracking-[0.06em] text-navy-deep uppercase">
            <th className="px-5 py-3.5">Contract</th>
            <th className="px-5 py-3.5">Uploaded</th>
            <th className="px-5 py-3.5">Stage</th>
            <th className="px-5 py-3.5 text-right" />
          </tr>
        </thead>
        <tbody className="divide-y divide-line">
          {contracts.map((contract) => {
            const isComplete = REVIEW_COMPLETE_STATUSES.includes(
              contract.status,
            );

            return (
              <tr
                key={contract.id}
                onClick={() =>
                  isComplete
                    ? onViewReport(contract.id)
                    : onTrackContract(contract.id)
                }
                className="cursor-pointer transition-colors duration-120 hover:bg-parchment/60"
              >
                <td className="px-5 py-4 align-middle">
                  <div className="flex flex-col gap-0.5">
                    <span className="font-semibold text-ink text-[14px]">
                      {contract.title}
                    </span>
                    <span className="font-mono text-[11px] text-ink-soft">
                      Request #{contract.requestNumber}
                    </span>
                  </div>
                </td>
                <td className="px-5 py-4 font-mono text-[12.5px] text-ink-soft whitespace-nowrap align-middle">
                  {formatShortDate(contract.uploadedAt)}
                </td>
                <td className="px-5 py-4 align-middle">
                  <ClientStageBadge status={contract.status} />
                </td>
                <td className="px-5 py-4 text-right align-middle whitespace-nowrap">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (isComplete) {
                        onViewReport(contract.id);
                      } else {
                        onTrackContract(contract.id);
                      }
                    }}
                    className="font-semibold text-[12.5px] text-maroon hover:text-maroon-bright transition-colors cursor-pointer"
                  >
                    {isComplete ? "View report →" : "Track →"}
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
