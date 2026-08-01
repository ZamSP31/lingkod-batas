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
 * The attorney's "My contracts" list (Fig. 3.24 in the design doc):
 * filename/title, upload date, high-risk flag count, and status, with a
 * per-row checkbox for future bulk actions. Selection state lives here
 * since it's purely a table-local UI concern.
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
      <div className="rounded-xl border border-hairline bg-white">
        <EmptyState
          icon={<InboxIcon className="h-6 w-6" />}
          title="No contracts yet"
          description="Contracts your clients submit for review will show up here once they've been uploaded."
        />
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-hairline bg-white">
      <table className="w-full text-left">
        <thead>
          <tr className="border-b border-hairline bg-parchment-50 text-xs font-medium tracking-wide text-ink-400 uppercase">
            <th className="w-10 px-4 py-3">
              <Checkbox
                label="Select all contracts"
                checked={allSelected}
                onChange={toggleAll}
              />
            </th>
            <th className="px-3 py-3">Contract</th>
            <th className="px-3 py-3">Uploaded</th>
            <th className="px-3 py-3">Flags</th>
            <th className="px-3 py-3">Status</th>
          </tr>
        </thead>
        <tbody>
          {contracts.map((contract) => (
            <tr
              key={contract.id}
              className="border-b border-hairline last:border-b-0 hover:bg-navy-900/[0.02]"
            >
              <td className="w-10 px-4 py-3.5">
                <Checkbox
                  label={`Select ${contract.title}`}
                  checked={selectedIds.has(contract.id)}
                  onChange={() => toggleOne(contract.id)}
                />
              </td>
              <td className="max-w-xs px-3 py-3.5">
                <button
                  type="button"
                  onClick={() => onOpenContract(contract.id)}
                  className="text-left text-sm font-medium text-ink-900 hover:text-navy-800 hover:underline"
                >
                  {contract.title}
                </button>
              </td>
              <td className="px-3 py-3.5 text-sm whitespace-nowrap text-ink-600">
                {formatShortDate(contract.uploadedAt)}
              </td>
              <td className="px-3 py-3.5 text-sm whitespace-nowrap text-ink-600">
                {formatHighRiskCount(contract.highRiskFlagCount)}
              </td>
              <td className="px-3 py-3.5">
                <StatusBadge status={contract.status} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default ContractsTable;
