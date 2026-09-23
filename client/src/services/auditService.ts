/**
 * auditService.ts
 * Frontend service for the Lingkod Batas System Audit Logs API (/api/audit-logs).
 */

const BASE_URL = import.meta.env.VITE_API_URL ?? "http://localhost:5000";

export type AuditAction =
  | "USER_LOGIN"
  | "USER_REGISTER"
  | "CONTRACT_SUBMITTED"
  | "OCR_PROCESSED"
  | "AI_ANALYSIS_COMPLETED"
  | "CONTRACT_ASSIGNED"
  | "FLAG_REVIEWED"
  | "FLAG_OVERRIDDEN"
  | "REVIEW_COMPLETED"
  | "REPORT_VIEWED"
  | "REPORT_DOWNLOADED"
  | "STATUTORY_SOURCE_CREATED"
  | "STATUTORY_SOURCE_UPDATED"
  | "STATUTORY_SOURCE_DELETED";

export interface AuditLogEntry {
  _id: string;
  userId?: string | null;
  userName: string;
  userEmail?: string | null;
  userRole: "client" | "attorney" | "admin" | "system";
  action: AuditAction;
  entityType:
    | "contract"
    | "clause_flag"
    | "statutory_source"
    | "user"
    | "auth"
    | "system";
  entityId?: string | null;
  entityLabel?: string | null;
  details?: Record<string, unknown>;
  ipAddress?: string | null;
  userAgent?: string | null;
  timestamp: string;
}

export interface AuditLogsResponse {
  logs: AuditLogEntry[];
  total: number;
  page: number;
  pages: number;
}

export interface AuditFilterOptions {
  q?: string | undefined;
  category?:
    | ("all" | "contracts" | "ai" | "reviews" | "statutory" | "auth")
    | undefined;
  action?: string | undefined;
  page?: number | undefined;
  limit?: number | undefined;
}

/**
 * GET /api/audit-logs
 * Fetches paginated audit logs with search query and category filtering.
 */
export async function getAuditLogs(
  token: string,
  options: AuditFilterOptions = {},
): Promise<AuditLogsResponse> {
  const params = new URLSearchParams();

  if (options.q && options.q.trim()) {
    params.set("q", options.q.trim());
  }

  if (options.category && options.category !== "all") {
    params.set("category", options.category);
  }

  if (options.action) {
    params.set("action", options.action);
  }

  if (options.page) {
    params.set("page", String(options.page));
  }

  if (options.limit) {
    params.set("limit", String(options.limit));
  } else {
    params.set("limit", "25");
  }

  const res = await fetch(`${BASE_URL}/api/audit-logs?${params.toString()}`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message ?? "Failed to fetch audit logs.");
  }

  return (await res.json()) as AuditLogsResponse;
}

/**
 * GET /api/audit-logs/contract/:contractId
 * Retrieves the full chronological audit trail for a single contract.
 */
export async function getContractAuditTrail(
  contractId: string,
  token: string,
): Promise<{ contractId: string; count: number; trail: AuditLogEntry[] }> {
  const res = await fetch(`${BASE_URL}/api/audit-logs/contract/${contractId}`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message ?? "Failed to fetch contract audit trail.");
  }

  return await res.json();
}

/**
 * GET /api/audit-logs/export
 * Downloads the audit logs as a CSV file.
 */
export async function downloadAuditLogsCsv(
  token: string,
  category?: string,
  action?: string,
): Promise<void> {
  const params = new URLSearchParams();
  if (category && category !== "all") params.set("category", category);
  if (action) params.set("action", action);

  const res = await fetch(
    `${BASE_URL}/api/audit-logs/export?${params.toString()}`,
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  );

  if (!res.ok) {
    throw new Error("Failed to export audit logs CSV.");
  }

  const blob = await res.blob();
  const downloadUrl = window.URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = downloadUrl;
  a.download = `lingkod-batas-audit-trail-${Date.now()}.csv`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.URL.revokeObjectURL(downloadUrl);
}
