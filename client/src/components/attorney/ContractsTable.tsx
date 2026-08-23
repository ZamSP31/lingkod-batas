import { useState } from "react";
import Checkbox from "../ui/Checkbox.js";
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
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const allSelected =
    contracts.length > 0 && selectedIds.size === contracts.length;

  function toggleAll() {
    setSelectedIds(
      allSelected ? new Set() : new Set(contracts.map((c) => c.id)),
    );
  }

  function toggleOne(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  if (contracts.length === 0) {
    return (
      <div className="overflow-hidden rounded-lg[8px] border border-line bg-white">
        <EmptyState
          icon={<InboxIcon className="h-6 w-6" />}
          title="No contracts yet"
          description="Contracts your clients submit for review will show up here once they've been uploaded."
        />
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-lg[8px] border border-line bg-white shadow-2xs">
      <table className="w-full border-collapse text-left">
        <thead>
          <tr className="border-b border-line bg-parchment font-mono text-[10.5px] font-medium tracking-[0.06em] text-ink-soft uppercase">
            <th className="w-[36px] px-5 py-3.5">
              <Checkbox
                label="Select all contracts"
                checked={allSelected}
                onChange={toggleAll}
              />
            </th>
            <th className="px-5 py-3.5">Contract</th>
            <th className="px-5 py-3.5">Uploaded</th>
            <th className="px-5 py-3.5">Flags</th>
            <th className="px-5 py-3.5">Status</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-line">
          {contracts.map((contract) => {
            const hasFlags = contract.highRiskFlagCount > 0;
            const isWaiting = contract.status === "awaiting-review";

            return (
              <tr
                key={contract.id}
                onClick={() => onOpenContract(contract.id)}
                className="cursor-pointer transition-colors duration-120 hover:bg-parchment/60"
              >
                <td
                  className="w-[36px] px-5 py-4 align-middle"
                  onClick={(e) => e.stopPropagation()}
                >
                  <Checkbox
                    label={`Select ${contract.title}`}
                    checked={selectedIds.has(contract.id)}
                    onChange={() => toggleOne(contract.id)}
                  />
                </td>
                <td className="px-5 py-4 align-middle">
                  <div className="flex flex-col gap-0.5">
                    <span className="font-semibold text-ink text-[14px]">
                      {contract.title}
                    </span>
                    {contract.waitingText ? (
                      <span
                        className={`font-mono text-[11px] ${
                          isWaiting ? "text-maroon" : "text-ink-soft opacity-55"
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
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export default ContractsTable;
