import type { ContractStatus } from "../../types/contract.js";

const STAGE_META: Record<
  ContractStatus,
  { label: string; textClass: string; dotClass: string }
> = {
  "ocr-processing": {
    label: "Processing",
    textClass: "text-ink-soft",
    dotClass: "bg-ink-soft",
  },
  "ai-analysis": {
    label: "Analyzing",
    textClass: "text-navy",
    dotClass: "bg-navy",
  },
  "awaiting-review": {
    label: "Awaiting review",
    textClass: "text-gold",
    dotClass: "bg-gold",
  },
  "under-review": {
    label: "Under review",
    textClass: "text-maroon",
    dotClass: "bg-maroon",
  },
  approved: {
    label: "Completed",
    textClass: "text-green",
    dotClass: "bg-green",
  },
  rejected: {
    label: "Changes requested",
    textClass: "text-maroon",
    dotClass: "bg-maroon",
  },
};

interface ClientStageBadgeProps {
  status: ContractStatus;
}

/**
 * Client stage indicator pairing colored dot with IBM Plex Mono text label.
 */
function ClientStageBadge({ status }: ClientStageBadgeProps) {
  const meta = STAGE_META[status] ?? {
    label: status,
    textClass: "text-ink-soft",
    dotClass: "bg-ink-soft",
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 font-mono text-[11px] font-medium tracking-[0.03em] uppercase ${meta.textClass}`}
    >
      <span className={`h-[7px] w-[7px] shrink-0 rounded-full ${meta.dotClass}`} />
      {meta.label}
    </span>
  );
}

export default ClientStageBadge;