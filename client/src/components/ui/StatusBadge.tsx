import type { ContractStatus } from "../../types/contract.js";
import type { ClauseRiskLevel } from "../../types/clause.js";

const STATUS_META: Record<
  ContractStatus,
  { label: string; className: string }
> = {
  "ocr-processing": {
    label: "OCR processing",
    className: "bg-ink/5 text-ink-soft",
  },
  "ai-analysis": {
    label: "AI analysis",
    className: "bg-navy/10 text-navy",
  },
  "awaiting-review": {
    label: "Awaiting review",
    className: "bg-gold/15 text-gold",
  },
  "under-review": {
    label: "Under review",
    className: "bg-gold/15 text-gold",
  },
  approved: {
    label: "Approved",
    className: "bg-green/15 text-green",
  },
  rejected: {
    label: "Rejected",
    className: "bg-maroon/15 text-maroon",
  },
};

interface StatusBadgeProps {
  status: ContractStatus;
}

/** A small rounded pill reflecting where a contract sits in the review pipeline. */
function StatusBadge({ status }: StatusBadgeProps) {
  const meta = STATUS_META[status] ?? {
    label: status,
    className: "bg-ink/5 text-ink-soft",
  };

  return (
    <span
      className={`inline-block font-mono text-[10px] font-medium tracking-[0.04em] uppercase px-[11px] py-[4px] rounded-[20px] whitespace-nowrap ${meta.className}`}
    >
      {meta.label}
    </span>
  );
}

export default StatusBadge;

const CLAUSE_RISK_META: Record<
  ClauseRiskLevel,
  { label: string; dotClass: string; textClass: string }
> = {
  high: { label: "High-risk", dotClass: "bg-maroon", textClass: "text-maroon" },
  medium: { label: "Medium-risk", dotClass: "bg-maroon/80", textClass: "text-maroon/90" },
  low: { label: "0 high-risk", dotClass: "bg-green", textClass: "text-green" },
};

interface ClauseRiskBadgeProps {
  level: ClauseRiskLevel;
}

/** A dot + mono text risk indicator */
export function ClauseRiskBadge({ level }: ClauseRiskBadgeProps) {
  const meta = CLAUSE_RISK_META[level];

  return (
    <span
      className={`inline-flex items-center gap-1.5 font-mono text-[11px] tracking-[0.02em] font-medium ${meta.textClass}`}
    >
      <span className={`h-[7px] w-[7px] shrink-0 rounded-full ${meta.dotClass}`} />
      {meta.label}
    </span>
  );
}