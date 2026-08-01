import type { ContractSummary } from "../types/contract.js";

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
