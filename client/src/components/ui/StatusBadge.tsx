import type { ContractStatus } from "../../types/contract.js";

const STATUS_META: Record<
  ContractStatus,
  { label: string; className: string }
> = {
  "ocr-processing": {
    label: "OCR processing",
    className: "bg-ink-400/10 text-ink-600",
  },
  "ai-analysis": {
    label: "AI analysis",
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
    label: "Approved",
    className: "bg-green-50 text-green-700",
  },
  rejected: {
    label: "Rejected",
    className: "bg-maroon-600/10 text-maroon-700",
  },
};

interface StatusBadgeProps {
  status: ContractStatus;
}

/** A small rounded pill reflecting where a contract sits in the review pipeline. */
function StatusBadge({ status }: StatusBadgeProps) {
  const meta = STATUS_META[status];

  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium whitespace-nowrap ${meta.className}`}
    >
      {meta.label}
    </span>
  );
}

export default StatusBadge;
