/**
 * kbService.ts
 * Frontend service for the Philippine Statutory Knowledge Base (/api/knowledge-base).
 */

const BASE_URL = import.meta.env.VITE_API_URL ?? "http://localhost:5000";

export interface BackendStatutorySource {
  _id: string;
  citation: string;
  title: string;
  sourceType:
    | "labor_code"
    | "dole_department_order"
    | "dole_advisory"
    | "republic_act"
    | "other";
  provisionNumber?: string;
  provisionText: string;
  issuanceDate?: string | null;
  isActive: boolean;
  tags: string[];
  addedBy?: { _id: string; fullName: string; email: string };
  lastUpdatedBy?: { _id: string; fullName: string; email: string };
  createdAt: string;
  updatedAt: string;
}

interface SourcesListResponse {
  sources: BackendStatutorySource[];
  total: number;
  page: number;
  pages: number;
}

/**
 * GET /api/knowledge-base
 * Fetches statutory sources with optional search query and tag filtering.
 */
export async function getStatutorySources(
  token: string,
  searchQuery?: string,
  tag?: string,
): Promise<BackendStatutorySource[]> {
  const params = new URLSearchParams();
  if (searchQuery && searchQuery.trim()) {
    params.set("q", searchQuery.trim());
  }
  if (tag && tag.trim()) {
    params.set("tag", tag.trim());
  }
  params.set("limit", "50");

  const url = `${BASE_URL}/api/knowledge-base?${params.toString()}`;
  const res = await fetch(url, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message ?? "Failed to fetch statutory sources.");
  }

  const data = (await res.json()) as SourcesListResponse;
  return data.sources;
}

/**
 * POST /api/knowledge-base
 * Registers a new statutory source or DOLE issuance.
 */
export async function createStatutorySource(
  sourceData: {
    citation: string;
    title: string;
    sourceType: string;
    provisionNumber?: string;
    provisionText: string;
    tags?: string[];
    issuanceDate?: string;
  },
  token: string,
): Promise<BackendStatutorySource> {
  const res = await fetch(`${BASE_URL}/api/knowledge-base`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(sourceData),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message ?? "Failed to register statutory source.");
  }

  const data = await res.json();
  return data.source;
}

