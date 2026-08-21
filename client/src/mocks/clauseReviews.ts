import type { ContractReview } from "../types/clause.js";

/**
 * Placeholder standing in for GET /api/contracts/:id/clauses (Fig. 3.26).
 * Keyed by contract id so ReviewQueuePage can look up the right review
 * for whatever :contractId the attorney navigated to from either
 * "My contracts" or the sidebar's "Review queue" link.
 *
 * Only c-1002 (the NDA in mocks/contracts.ts) has a fully fleshed-out
 * review for now, matching the six-clause NDA mockup. Real contracts
 * will each have their own clause set once the AI-analysis endpoint
 * exists — getClauseReview() below falls back to this one so every
 * contract id in the demo has something to show.
 */
export const mockClauseReviews: Record<string, ContractReview> = {
  "c-1002": {
    contractId: "c-1002",
    fileName: "Contract_0417.pdf",
    contractTypeLabel: "Non-disclosure agreement",
    clauses: [
      {
        id: "clause-1-2",
        clauseNumber: "1.2",
        title: "Confidentiality scope",
        riskLevel: "high",
        quotedText:
          "The Employee agrees that all information disclosed by the Employer, whether or not marked confidential, and regardless of its nature, shall be treated as confidential indefinitely.",
        flagReason:
          "The clause defines confidential information with no scope limitation and imposes an indefinite duration, which is broader than what is typically enforceable.",
        legalBasis: {
          citation: "Civil Code, Art. 1306",
          explanation:
            "Contractual stipulations must not be contrary to law, morals, or public policy; indefinite, unbounded restrictions on a former employee's conduct risk running afoul of this limit.",
        },
      },
      {
        id: "clause-2-1",
        clauseNumber: "2.1",
        title: "Duration of obligation",
        riskLevel: "high",
        quotedText:
          "This Agreement and the obligations of confidentiality herein shall remain in full force and effect in perpetuity, surviving termination of employment without limitation.",
        flagReason:
          "An unbounded, perpetual survival clause with no post-termination end date is broader than standard NDA practice and may be difficult to enforce as written.",
        legalBasis: {
          citation: "Civil Code, Art. 1306",
          explanation:
            "As with the scope clause above, a stipulation with no temporal limit is more likely to be read as contrary to public policy and struck down or narrowed by a court.",
        },
      },
      {
        id: "clause-3-4",
        clauseNumber: "3.4",
        title: "Permitted disclosures",
        riskLevel: "medium",
        quotedText:
          "The Employee may disclose confidential information only with the prior written consent of the Employer, except as otherwise required by a valid order of a court or government agency.",
        flagReason:
          "The carve-out for legally compelled disclosure is present but narrow — it doesn't clearly address disclosures to the Employee's own counsel or regulators acting sua sponte.",
        legalBasis: {
          citation: "Labor Code, Art. 118",
          explanation:
            "Provisions that could be read to discourage reporting to labor authorities warrant a closer look, even where the clause is facially compliant.",
        },
      },
      {
        id: "clause-4-1",
        clauseNumber: "4.1",
        title: "Remedies for breach",
        riskLevel: "high",
        quotedText:
          "In the event of any breach or threatened breach of this Agreement, the Employer shall be entitled to liquidated damages of ₱500,000, without the need to prove actual loss.",
        flagReason:
          "A fixed liquidated-damages figure set without reference to actual or anticipated harm may be reduced by a court as unconscionable, particularly given the uncapped scope in Clauses 1.2 and 2.1.",
        legalBasis: {
          citation: "Civil Code, Art. 2227",
          explanation:
            "Liquidated damages may be equitably reduced by the courts if iniquitous or unconscionable, regardless of what the contract stipulates.",
        },
      },
      {
        id: "clause-5-2",
        clauseNumber: "5.2",
        title: "Return of materials",
        riskLevel: "low",
        quotedText:
          "Upon termination of employment, the Employee shall return or destroy all documents, files, and materials containing confidential information within fifteen (15) days.",
      },
      {
        id: "clause-6-1",
        clauseNumber: "6.1",
        title: "Governing law",
        riskLevel: "low",
        quotedText:
          "This Agreement shall be governed by and construed in accordance with the laws of the Republic of the Philippines.",
      },
    ],
  },
};

const FALLBACK_REVIEW = mockClauseReviews["c-1002"]!;

/** Falls back to the c-1002 mock review so any contract id has something to render in the demo. */
export function getClauseReview(contractId: string): ContractReview {
  return mockClauseReviews[contractId] ?? FALLBACK_REVIEW;
}
