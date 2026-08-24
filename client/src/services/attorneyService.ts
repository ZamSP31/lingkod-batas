/**
 * attorneyService.ts
 * Frontend service for attorney review queue, flag inspections, overrides, and review completion.
 */

import type { ContractSummary } from "../types/contract.js";
import { mapBackendStatus } from "./contractService.js";

const BASE_URL = import.meta.env.VITE_API_URL ?? "http://localhost:5000";

export interface BackendStatutoryBase {
  sourceId?: {
    _id: string;
    title: string;
    citation: string;
    sourceType: string;
  };
  citation: string;
  excerpt: string;
}

export interface BackendFlag {
  _id: string;
  contractId: string;
  clauseText: string;
  clauseIndex: number;
  aiRiskLevel: "low" | "medium" | "high";
  aiRationale: string;
  statutoryBases: BackendStatutoryBase[];
  riskCategories: string[];
  attorneyStatus: "pending" | "approved" | "overridden" | "dismissed";
  attorneyRiskOverride?: "low" | "medium" | "high" | null;
  attorneyNote?: string;
  includedInReport: boolean;
  reviewedBy?: {
    _id: string;
    fullName: string;
    email: string;
  };
  reviewedAt?: string;
}

export interface AttorneyQueueResponse {
  count: number;
  contracts: Array<{
    _id: string;
    requestNumber: string;
    title: string;
    contractType: string;
    status: string;
    fileName: string;
    fileType: string;
    aiRiskLevel?: string;
    createdAt: string;
    clientId?: {
      _id: string;
      fullName: string;
      email: string;
    };
  }>;
}

/**
 * GET /api/attorney/queue
 * Fetches all contracts in the attorney review queue.
 */
export async function getAttorneyQueue(
  token: string,
): Promise<ContractSummary[]> {
  const res = await fetch(`${BASE_URL}/api/attorney/queue`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!res.ok) {
    const errorBody = await res.json().catch(() => ({}));
    throw new Error(errorBody.message ?? "Failed to fetch review queue.");
  }

  const data = (await res.json()) as AttorneyQueueResponse;
  return (data.contracts || []).map((c) => ({
    id: c._id,
    title: `${c.title} (${c.requestNumber})`,
    uploadedAt: c.createdAt,
    highRiskFlagCount: c.aiRiskLevel === "high" ? 1 : 0,
    status: mapBackendStatus(c.status),
    waitingText:
      c.status === "completed"
        ? "Review Completed"
        : c.status === "under_review"
          ? "Under Review"
          : "Awaiting Review",
  }));
}

/**
 * GET /api/attorney/contracts/:id/flags
 * Retrieves all AI risk flags for a specific contract.
 */
export async function getContractFlags(
  contractId: string,
  token: string,
): Promise<BackendFlag[]> {
  const res = await fetch(
    `${BASE_URL}/api/attorney/contracts/${contractId}/flags`,
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  );

  if (!res.ok) {
    const errorBody = await res.json().catch(() => ({}));
    throw new Error(errorBody.message ?? "Failed to fetch contract flags.");
  }

  const data = await res.json();
  return data.flags || [];
}

/**
 * PATCH /api/attorney/contracts/:id/assign
 * Claims a contract for review.
 */
export async function assignContract(contractId: string, token: string) {
  const res = await fetch(
    `${BASE_URL}/api/attorney/contracts/${contractId}/assign`,
    {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  );

  if (!res.ok) {
    const errorBody = await res.json().catch(() => ({}));
    throw new Error(errorBody.message ?? "Failed to assign contract.");
  }

  return res.json();
}

/**
 * PATCH /api/attorney/flags/:flagId
 * Updates or overrides an AI risk flag.
 */
export async function updateFlag(
  flagId: string,
  payload: {
    attorneyStatus?: string;
    attorneyRiskOverride?: string | null;
    attorneyNote?: string;
    includedInReport?: boolean;
  },
  token: string,
) {
  const res = await fetch(`${BASE_URL}/api/attorney/flags/${flagId}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const errorBody = await res.json().catch(() => ({}));
    throw new Error(errorBody.message ?? "Failed to update flag.");
  }

  return res.json();
}

/**
 * PATCH /api/attorney/contracts/:id/complete
 * Finalizes attorney review and releases report to client.
 */
export async function completeContractReview(
  contractId: string,
  payload: {
    attorneyNotes?: string;
    attorneyRiskOverride?: string | null;
  },
  token: string,
) {
  const res = await fetch(
    `${BASE_URL}/api/attorney/contracts/${contractId}/complete`,
    {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    },
  );

  if (!res.ok) {
    const errorBody = await res.json().catch(() => ({}));
    throw new Error(errorBody.message ?? "Failed to complete review.");
  }

  return res.json();
}
