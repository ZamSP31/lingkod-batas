/**
 * Mirrors the five-stage review pipeline from the system design doc
 * (Track Contract Review Status: OCR Processing -> AI Analysis ->
 * Awaiting Attorney Review -> Under Review -> Completed). The attorney
 * dashboard only ever surfaces contracts once they reach
 * "awaiting-review" or later, since earlier stages aren't yet the
 * attorney's concern.
 */
export type ContractStatus =
  | "ocr-processing"
  | "ai-analysis"
  | "awaiting-review"
  | "under-review"
  | "approved"
  | "rejected";

/** The clause-classification model to apply, chosen at upload time (Fig. 3.25). */
export type ContractType = "employment" | "nda";

export const CONTRACT_TYPE_OPTIONS: { value: ContractType; label: string }[] = [
  { value: "employment", label: "Employment contract" },
  { value: "nda", label: "Non-disclosure agreement" },
];
/**
 * A single row in the attorney's "My contracts" table. This is the
 * summary shape returned by GET /api/contracts (list view) — the full
 * clause-level analysis (risk flags, citations, rationale) is a
 * separate, heavier shape fetched per-contract on the Review Queue page.
 */
export interface ContractSummary {
  id: string;
  title: string;
  uploadedAt: string; // ISO 8601 date string
  highRiskFlagCount: number;
  status: ContractStatus;
  waitingText?: string;
}

/**
 * A single row in the client's "My contracts" table (Fig. 3.29). Unlike
 * ContractSummary (the attorney's view), this carries the client-facing
 * request number instead of a flag count — clients see stage/progress,
 * not clause-level risk counts, until the finalized report is ready.
 */
export interface ClientContractSummary {
  id: string;
  title: string;
  /** Shown under the title, e.g. "LB-2026-0142" (displayed as "Request #LB-2026-0142"). */
  requestNumber: string;
  uploadedAt: string; // ISO 8601 date string
  status: ContractStatus;
}

/** Statuses where the attorney's review has concluded and a report exists to view/download. */
export const REVIEW_COMPLETE_STATUSES: ContractStatus[] = [
  "approved",
  "rejected",
];

import type { ContractReview } from "./clause.js";

/**
 * The finalized report a client sees on Contract report (Fig. 3.30) —
 * the clause-by-clause breakdown from ContractReview, plus the
 * reviewing attorney's identity, sign-off date, and closing remarks.
 * The client never sees flag counts pre-review; this shape only
 * applies once status is "approved" or "rejected".
 */
export interface ClientContractReport extends ContractReview {
  reviewedByAttorney: string;
  reviewedDate: string; // display string, e.g. "Jul 12, 2026"
  attorneyComments: string;
  pdfUrl?: string;
}
