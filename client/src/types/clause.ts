/**
 * The per-clause AI risk classification shown on the Review Queue
 * (Fig. 3.26). "high"/"medium" clauses are flagged and always carry a
 * `flagReason` + `legalBasis`; "low" clauses are informational and may
 * omit both.
 */
export type ClauseRiskLevel = "high" | "medium" | "low";

/**
 * The statutory (or contractual) citation backing a risk flag — e.g.
 * "Civil Code, Art. 1306" plus a short plain-language gloss of why that
 * provision matters here. Kept separate from `flagReason` so the UI can
 * style the "why" and the "legal basis" as distinct sections, matching
 * the mockup.
 */
export interface ClauseLegalBasis {
  citation: string;
  explanation: string;
}

/**
 * A single clause within a contract's AI analysis. This is the
 * clause-level detail that GET /api/contracts/:id/clauses will
 * eventually return — heavier than ContractSummary, so it's fetched
 * per-contract only when the attorney opens the Review Queue for that
 * contract, rather than bundled into the "My contracts" list response.
 */
export interface ContractClause {
  id: string;
  /** e.g. "1.2" — displayed as "Clause 1.2". */
  clauseNumber: string;
  title: string;
  riskLevel: ClauseRiskLevel;
  originalAiRiskLevel?: ClauseRiskLevel;
  attorneyStatus?: "pending" | "approved" | "overridden" | "dismissed";
  attorneyNote?: string;
  /** The verbatim (mocked) contract text this clause covers. */
  quotedText: string;
  /** Present for "high"/"medium" risk clauses — the AI's rationale for the flag. */
  flagReason?: string;
  /** Present for "high"/"medium" risk clauses — the statutory basis for the flag. */
  legalBasis?: ClauseLegalBasis;
}

/**
 * The full clause-by-clause review for one contract, as shown in the
 * Review Queue's document header ("Contract_0417.pdf · 6 clauses").
 */
export interface ContractReview {
  contractId: string;
  fileName: string;
  contractTypeLabel: string;
  clauses: ContractClause[];
}
