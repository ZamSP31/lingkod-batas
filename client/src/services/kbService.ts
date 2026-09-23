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
  fileUrl?: string | null;
  filePublicId?: string | null;
  fileName?: string | null;
  fileSize?: number | null;
  fileType?: string | null;
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

export interface ExtractedDocumentData {
  text: string;
  fileName: string;
  fileSize: number;
  fileType: string;
  suggestedTitle: string;
  suggestedCitation: string;
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
 * GET /api/knowledge-base/:id
 * Fetches a single statutory source by ID.
 */
export async function getStatutorySourceById(
  id: string,
  token: string,
): Promise<BackendStatutorySource> {
  const res = await fetch(`${BASE_URL}/api/knowledge-base/${id}`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message ?? "Failed to fetch statutory source.");
  }

  const data = await res.json();
  return data.source;
}

/**
 * POST /api/knowledge-base/extract-text
 * Sends a file to the OCR engine to extract raw text and metadata before submission.
 */
export async function extractTextFromFile(
  file: File,
  token: string,
): Promise<ExtractedDocumentData> {
  const formData = new FormData();
  formData.append("documentFile", file);

  const res = await fetch(`${BASE_URL}/api/knowledge-base/extract-text`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: formData,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message ?? "Failed to extract text from file.");
  }

  return (await res.json()) as ExtractedDocumentData;
}

/**
 * POST /api/knowledge-base
 * Registers a new statutory source or DOLE issuance (supports FormData with file).
 */
export async function createStatutorySource(
  sourceData:
    | FormData
    | {
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
  const isFormData = sourceData instanceof FormData;
  const headers: Record<string, string> = {
    Authorization: `Bearer ${token}`,
  };
  if (!isFormData) {
    headers["Content-Type"] = "application/json";
  }

  const res = await fetch(`${BASE_URL}/api/knowledge-base`, {
    method: "POST",
    headers,
    body: isFormData ? sourceData : JSON.stringify(sourceData),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message ?? "Failed to register statutory source.");
  }

  const data = await res.json();
  return data.source;
}

/**
 * PATCH /api/knowledge-base/:id
 * Updates an existing statutory source (supports FormData with replacement file).
 */
export async function updateStatutorySource(
  id: string,
  sourceData:
    | FormData
    | {
        citation?: string;
        title?: string;
        sourceType?: string;
        provisionNumber?: string;
        provisionText?: string;
        tags?: string[];
        issuanceDate?: string | null;
        isActive?: boolean;
        removeFile?: boolean;
      },
  token: string,
): Promise<BackendStatutorySource> {
  const isFormData = sourceData instanceof FormData;
  const headers: Record<string, string> = {
    Authorization: `Bearer ${token}`,
  };
  if (!isFormData) {
    headers["Content-Type"] = "application/json";
  }

  const res = await fetch(`${BASE_URL}/api/knowledge-base/${id}`, {
    method: "PATCH",
    headers,
    body: isFormData ? sourceData : JSON.stringify(sourceData),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message ?? "Failed to update statutory source.");
  }

  const data = await res.json();
  return data.source;
}

/**
 * DELETE /api/knowledge-base/:id
 * Deletes a statutory source provision (and any attached cloud file).
 */
export async function deleteStatutorySource(
  id: string,
  token: string,
  soft = false,
): Promise<{ message: string; sourceId: string }> {
  const url = `${BASE_URL}/api/knowledge-base/${id}${soft ? "?soft=true" : ""}`;
  const res = await fetch(url, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message ?? "Failed to delete statutory source.");
  }

  return await res.json();
}
