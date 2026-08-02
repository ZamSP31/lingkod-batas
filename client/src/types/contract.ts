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
}
