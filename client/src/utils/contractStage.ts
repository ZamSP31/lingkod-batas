import type { ContractStatus } from "../types/contract.js";

/**
 * The five-stage review pipeline shown on Track status (Fig. 3.24):
 * OCR Processing -> AI Analysis -> Awaiting Attorney Review ->
 * Under Review -> Completed. Both "approved" and "rejected" contract
 * statuses map to the final "Completed" stage — the stepper only
 * tracks pipeline position, not outcome.
 */
export const REVIEW_STAGE_LABELS = [
  "OCR Processing",
  "AI Analysis",
  "Awaiting Attorney Review",
  "Under Review",
  "Completed",
] as const;

const STATUS_TO_STAGE_INDEX: Record<ContractStatus, number> = {
  "ocr-processing": 0,
  "ai-analysis": 1,
  "awaiting-review": 2,
  "under-review": 3,
  approved: 4,
  rejected: 4,
};

/** Converts a contract's current status into a 0-based stepper index. */
export function stageIndexForStatus(status: ContractStatus): number {
  return STATUS_TO_STAGE_INDEX[status];
}

/** Copy shown under the stepper on Track status, keyed by stage index. */
export const STAGE_STATUS_MESSAGES: Record<number, string> = {
  0: "Your contract has been received and is being scanned for text extraction.",
  1: "Your contract is being analyzed by the AI risk engine.",
  2: "Your contract passed AI risk analysis and is now in the attorney's review queue. You'll be notified as soon as review begins — no action is needed from you right now.",
  3: "An attorney is currently reviewing your contract. This usually takes 1–2 business days.",
  4: "Your contract review is complete. You can view the full report from My contracts.",
};