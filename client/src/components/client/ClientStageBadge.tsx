import type { ContractStatus } from "../../types/contract.js";

/**
 * Client-facing copy for the same ContractStatus pipeline used on the
 * attorney side (ui/StatusBadge). Kept separate rather than shared
 * because the audiences need different words for the same stage —
 * clients see "Awaiting review" / "Completed", not internal pipeline
 * terms like "Approved" (Fig. 3.29).
 */
const STAGE_META: Record<ContractStatus, { label: string; className: string }> = {
  "ocr-processing": {
    label: "Processing",
    className: "bg-ink-400/10 text-ink-600",
  },
  "ai-analysis": {
    label: "Analyzing",
    className: "bg-blue-50 text-blue-700",
  },
  "awaiting-review": {
    label: "Awaiting review",
    className: "bg-amber-50 text-amber-700",
  },
  "under-review": {
    label: "Under review",
    className: "bg-blue-50 text-blue-700",
  },
  approved: {
    label: "Completed",
    className: "bg-green-50 text-green-700",
  },
  rejected: {
    label: "Changes requested",
    className: "bg-maroon-600/10 text-maroon-700",
  },
};

interface ClientStageBadgeProps {
  status: ContractStatus;
}

/** A small rounded pill reflecting where a contract sits, in client-facing language. */
function ClientStageBadge({ status }: ClientStageBadgeProps) {
  const meta = STAGE_META[status];

  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium whitespace-nowrap ${meta.className}`}
    >
      {meta.label}
    </span>
  );
}

export default ClientStageBadge;