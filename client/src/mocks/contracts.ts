import type { ClientContractSummary, ContractSummary } from "../types/contract.js";
import type { ClientContractReport } from "../types/contract.js";

/**
 * Placeholder data standing in for GET /api/contracts?attorneyId=... .
 * Swap the call site (AttorneyDashboardPage) to a real fetch/React Query
 * hook once that endpoint exists — the ContractSummary shape is designed
 * to match the eventual API response directly, so no reshaping should be
 * needed at the call site.
 */
export const mockAttorneyContracts: ContractSummary[] = [
  {
    id: "c-1001",
    title: "Freelance web dev agreement",
    uploadedAt: "2026-07-08",
    highRiskFlagCount: 2,
    status: "awaiting-review",
  },
  {
    id: "c-1002",
    title: "NDA — Studio Marikina",
    uploadedAt: "2026-07-07",
    highRiskFlagCount: 0,
    status: "awaiting-review",
  },
  {
    id: "c-1003",
    title: "Content licensing — Ateneo mag",
    uploadedAt: "2026-07-04",
    highRiskFlagCount: 1,
    status: "approved",
  },
  {
    id: "c-1004",
    title: "Consulting retainer — GreenBPO",
    uploadedAt: "2026-07-02",
    highRiskFlagCount: 0,
    status: "approved",
  },
];

/**
 * Placeholder data standing in for GET /api/contracts?clientId=me
 * (Fig. 3.29, "My contracts"). Swap the call site (ClientDashboardPage)
 * for a real fetch once that endpoint exists.
 */
export const mockClientContracts: ClientContractSummary[] = [
  {
    id: "c-2001",
    title: "Employment offer — Cebu BPO Corp",
    requestNumber: "LB-2026-0142",
    uploadedAt: "2026-07-18",
    status: "awaiting-review",
  },
  {
    id: "c-2002",
    title: "Freelance writing agreement",
    requestNumber: "LB-2026-0138",
    uploadedAt: "2026-07-12",
    status: "approved",
  },
  {
    id: "c-2003",
    title: "Retail associate contract",
    requestNumber: "LB-2026-0129",
    uploadedAt: "2026-07-04",
    status: "approved",
  },
];

/**
 * Placeholder data standing in for GET /api/contracts/:id/report
 * (Fig. 3.30, client-facing). Keyed by the same contract id used in
 * mockClientContracts, and only populated for ids whose status is
 * "approved" or "rejected".
 */
export const mockClientContractReports: Record<string, ClientContractReport> = {
  "c-2002": {
    contractId: "c-2002",
    fileName: "Freelance_writing_agreement.pdf",
    contractTypeLabel: "Freelance writing agreement",
    reviewedByAttorney: "Atty. Juan Dela Cruz",
    reviewedDate: "Jul 12, 2026",
    attorneyComments:
      "Recommend renegotiating the payment clause before signing. The termination notice period is short but not unusual for freelance arrangements — flagged for your awareness rather than as a blocking issue.",
    clauses: [
      {
        id: "cl-1",
        clauseNumber: "3.1",
        title: "Payment terms",
        riskLevel: "high",
        quotedText:
          'Payment shall be released upon client satisfaction, at client\u2019s sole discretion.',
        flagReason:
          'Payment is conditioned on "client satisfaction" with no defined review period, which effectively allows indefinite withholding of compensation.',
        legalBasis: {
          citation: "Labor Code, Art. 103",
          explanation: "Wages must be paid within regular, defined intervals.",
        },
      },
      {
        id: "cl-2",
        clauseNumber: "5.2",
        title: "Termination clause",
        riskLevel: "medium",
        quotedText:
          "Either party may terminate this agreement upon 3 days' written notice.",
        flagReason:
          "Either party may terminate with 3 days' notice, shorter than the standard notice period for continuing engagements.",
        legalBasis: {
          citation: "Labor Code, Art. 300",
          explanation: "Notice requirements for termination of employment.",
        },
      },
      {
        id: "cl-3",
        clauseNumber: "6.1",
        title: "Confidentiality",
        riskLevel: "low",
        quotedText:
          "Contractor shall keep project-specific materials confidential for 2 years following termination.",
      },
    ],
  },
  "c-2003": {
    contractId: "c-2003",
    fileName: "Retail_associate_contract.pdf",
    contractTypeLabel: "Retail associate contract",
    reviewedByAttorney: "Atty. Juan Dela Cruz",
    reviewedDate: "Jul 6, 2026",
    attorneyComments:
      "Overall a standard retail employment contract. Ask HR to put the regularization criteria in writing before your probationary period begins.",
    clauses: [
      {
        id: "cl-1",
        clauseNumber: "2.1",
        title: "Probationary period",
        riskLevel: "medium",
        quotedText:
          "Employee shall serve a probationary period of six (6) months from date of hire.",
        flagReason:
          "Probationary period extends to 6 months without a clear performance standard disclosed at the start of employment.",
        legalBasis: {
          citation: "Labor Code, Art. 296",
          explanation:
            "Probationary employees must be informed of reasonable standards for regularization at time of engagement.",
        },
      },
      {
        id: "cl-2",
        clauseNumber: "4.3",
        title: "Work schedule",
        riskLevel: "low",
        quotedText:
          "Employee shall work eight (8) hours daily, inclusive of a one-hour rest period.",
      },
    ],
  },
};