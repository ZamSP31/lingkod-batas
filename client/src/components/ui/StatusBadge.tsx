import type { ContractStatus } from "../../types/contract.js";
import type { ClauseRiskLevel } from "../../types/clause.js";

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

const CLAUSE_RISK_META: Record<
  ClauseRiskLevel,
  { label: string; className: string }
> = {
  high: { label: "High-risk", className: "bg-rose-100 text-rose-700" },
  medium: { label: "Moderate", className: "bg-amber-100 text-amber-800" },
  low: { label: "Low-risk", className: "bg-emerald-100 text-emerald-700" },
};

interface ClauseRiskBadgeProps {
  level: ClauseRiskLevel;
}

/** A small rounded pill reflecting a single clause's AI risk classification. */
export function ClauseRiskBadge({ level }: ClauseRiskBadgeProps) {
  const meta = CLAUSE_RISK_META[level];

  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium whitespace-nowrap ${meta.className}`}
    >
      {meta.label}
    </span>
  );
}