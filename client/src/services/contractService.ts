/**
 * contractService.ts
 * Frontend service for all contract submission, listing, and tracking endpoints.
 */

import type {
  ClientContractSummary,
  ContractStatus,
} from "../types/contract.js";

const BASE_URL = import.meta.env.VITE_API_URL ?? "http://localhost:5000";

interface BackendContract {
  _id: string;
  requestNumber: string;
  title: string;
  contractType: string;
  status: string;
  fileName: string;
  fileType: string;
  aiRiskLevel?: string;
  attorneyRiskOverride?: string | null;
  reportReleasedToClient?: boolean;
  createdAt: string;
  updatedAt: string;
}

interface ContractListResponse {
  contracts: BackendContract[];
}

interface SingleContractResponse {
  contract: BackendContract;
}

/**
 * Maps backend contract status enum values to the frontend ContractStatus type.
 */
export function mapBackendStatus(backendStatus: string): ContractStatus {
  switch (backendStatus) {
    case "pending":
    case "ocr_processing":
      return "ocr-processing";
    case "ai_analysis":
      return "ai-analysis";
    case "awaiting_attorney_review":
      return "awaiting-review";
    case "under_review":
      return "under-review";
    case "completed":
      return "approved";
    default:
      return "ocr-processing";
  }
}

/**
 * Transforms a backend contract document into a ClientContractSummary for table rendering.
 */
export function transformToClientSummary(
  c: BackendContract,
): ClientContractSummary {
  return {
    id: c._id,
    title: c.title,
    requestNumber: c.requestNumber,
    uploadedAt: c.createdAt,
    status: mapBackendStatus(c.status),
  };
}

/**
 * GET /api/contracts
 * Fetches all contracts belonging to the authenticated client.
 */
export async function getClientContracts(
  token: string,
): Promise<ClientContractSummary[]> {
  const res = await fetch(`${BASE_URL}/api/contracts`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!res.ok) {
    const errorBody = await res.json().catch(() => ({}));
    throw new Error(errorBody.message ?? "Failed to fetch contracts.");
  }

  const data = (await res.json()) as ContractListResponse;
  return (data.contracts || []).map(transformToClientSummary);
}

/**
 * GET /api/contracts/:id
 * Fetches a single contract by ID.
 */
export async function getContractById(
  id: string,
  token: string,
): Promise<BackendContract> {
  const res = await fetch(`${BASE_URL}/api/contracts/${id}`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!res.ok) {
    const errorBody = await res.json().catch(() => ({}));
    throw new Error(errorBody.message ?? "Failed to fetch contract.");
  }

  const data = (await res.json()) as SingleContractResponse;
  return data.contract;
}

/**
 * POST /api/contracts
 * Uploads a contract file with title and type for OCR & AI analysis.
 */
export async function submitContract(
  formData: FormData,
  token: string,
): Promise<BackendContract> {
  const res = await fetch(`${BASE_URL}/api/contracts`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: formData,
  });

  if (!res.ok) {
    const errorBody = await res.json().catch(() => ({}));
    throw new Error(errorBody.message ?? "Failed to submit contract.");
  }

  const data = await res.json();
  return data.contract;
}

export interface ContractReportResponse {
  contract: BackendContract & {
    attorneyNotes?: string;
    reviewCompletedAt?: string;
    reportReleasedAt?: string;
    assignedAttorneyId?: {
      _id: string;
      fullName: string;
      email: string;
      rollNumber?: string;
    };
  };
  flags: Array<{
    _id: string;
    contractId: string;
    clauseText: string;
    clauseIndex: number;
    aiRiskLevel: "low" | "medium" | "high";
    aiRationale: string;
    statutoryBases: Array<{
      sourceId?: {
        _id: string;
        title: string;
        citation: string;
        sourceType: string;
      };
      citation: string;
      excerpt: string;
    }>;
    riskCategories: string[];
    attorneyStatus: "pending" | "approved" | "overridden" | "dismissed";
    attorneyRiskOverride?: "low" | "medium" | "high" | null;
    attorneyNote?: string;
    includedInReport: boolean;
  }>;
}

/**
 * GET /api/contracts/:id/report
 * Fetches contract report details along with verified flags.
 */
export async function getContractReport(
  id: string,
  token: string,
): Promise<ContractReportResponse> {
  const res = await fetch(`${BASE_URL}/api/contracts/${id}/report`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!res.ok) {
    const errorBody = await res.json().catch(() => ({}));
    throw new Error(errorBody.message ?? "Failed to fetch contract report.");
  }

  return res.json();
}
