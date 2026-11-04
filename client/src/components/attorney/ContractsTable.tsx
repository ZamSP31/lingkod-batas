import StatusBadge from "../ui/StatusBadge.js";
import EmptyState from "../ui/EmptyState.js";
import { InboxIcon } from "./icons.js";
import { formatHighRiskCount, formatShortDate } from "../../utils/format.js";
import type { ContractSummary } from "../../types/contract.js";

interface ContractsTableProps {
  contracts: ContractSummary[];
  onOpenContract: (contractId: string) => void;
}

/**
 * The attorney's "My contracts" list matching the Lingkod Batas design mockup:
 * filename/title with waiting duration, upload date, high-risk flag indicators
 * (dot + mono label), and status pill badges.
 */
function ContractsTable({ contracts, onOpenContract }: ContractsTableProps) {
  if (contracts.length === 0) {
    return (
      <div className="overflow-hidden rounded-2xl border border-line bg-white shadow-xs mt-4">
        <EmptyState
          icon={<InboxIcon className="h-6 w-6" />}
          title="No contracts yet"
          description="Contracts your clients submit for review will show up here once they've been uploaded."
        />
      </div>
    );
  }

  return (
    <>
      <div className="mt-4 grid gap-3 md:hidden">
        {contracts.map((contract) => {
          const hasFlags = contract.highRiskFlagCount > 0;
          const isApproved = contract.status === "approved";
          return (
            <button
              key={contract.id}
              type="button"
              onClick={() => onOpenContract(contract.id)}
              className="w-full rounded-2xl border border-line bg-white p-4 text-left shadow-xs"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate font-semibold text-[14px] text-ink">{contract.title}</p>
                  {contract.waitingText && <p className="mt-1 font-mono text-[11px] text-ink-soft">{contract.waitingText}</p>}
                </div>
                <StatusBadge status={contract.status} />
              </div>
              <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-line pt-3 text-xs">
                <span className="font-mono text-ink-soft">{formatShortDate(contract.uploadedAt)}</span>
                <span className={`font-mono text-[11px] ${hasFlags ? "text-maroon" : "text-green"}`}>{formatHighRiskCount(contract.highRiskFlagCount)}</span>
                <span className="font-semibold text-maroon">{isApproved ? "View report →" : "Review clauses →"}</span>
              </div>
            </button>
          );
        })}
      </div>
      <div className="mt-4 hidden overflow-x-auto rounded-2xl border border-line bg-white shadow-xs md:block">
      <table className="w-full min-w-[760px] border-collapse text-left">
        <thead>
          <tr className="border-b-2 border-line bg-[#ECE5D6] font-mono text-[11px] font-bold tracking-[0.06em] text-navy-deep uppercase">
            <th className="px-5 py-3.5">Contract</th>
            <th className="px-5 py-3.5">Uploaded</th>
            <th className="px-5 py-3.5">Flags</th>
            <th className="px-5 py-3.5">Status</th>
            <th className="px-5 py-3.5 text-right">Action</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-line">
          {contracts.map((contract) => {
            const hasFlags = contract.highRiskFlagCount > 0;
            const isWaiting = contract.status === "awaiting-review";
            const isApproved = contract.status === "approved";

            return (
              <tr
                key={contract.id}
                onClick={() => onOpenContract(contract.id)}
                className="cursor-pointer transition-colors duration-120 hover:bg-parchment/60"
              >
                <td className="px-5 py-4 align-middle">
                  <div className="flex flex-col gap-0.5">
                    <span className="font-semibold text-ink text-[14px]">
                      {contract.title}
                    </span>
                    {contract.waitingText ? (
                      <span
                        className={`font-mono text-[11px] ${
                          isWaiting
                            ? "text-maroon font-medium"
                            : "text-ink-soft opacity-55"
                        }`}
                      >
                        {contract.waitingText}
                      </span>
                    ) : null}
                  </div>
                </td>
                <td className="px-5 py-4 font-mono text-[12.5px] text-ink-soft whitespace-nowrap align-middle">
                  {formatShortDate(contract.uploadedAt)}
                </td>
                <td className="px-5 py-4 whitespace-nowrap align-middle">
                  <span
                    className={`inline-flex items-center gap-1.5 font-mono text-[11px] tracking-[0.02em] font-medium ${
                      hasFlags ? "text-maroon" : "text-green"
                    }`}
                  >
                    <span
                      className={`h-[7px] w-[7px] shrink-0 rounded-full ${
                        hasFlags ? "bg-maroon" : "bg-green"
                      }`}
                    />
                    {formatHighRiskCount(contract.highRiskFlagCount)}
                  </span>
                </td>
                <td className="px-5 py-4 align-middle">
                  <StatusBadge status={contract.status} />
                </td>
                <td className="px-5 py-4 text-right align-middle whitespace-nowrap">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onOpenContract(contract.id);
                    }}
                    className="font-semibold text-[12.5px] text-maroon hover:text-maroon-bright transition-colors cursor-pointer"
                  >
                    {isApproved ? "View report →" : "Review clauses →"}
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      </div>
    </>
  );
}

export default ContractsTable;
