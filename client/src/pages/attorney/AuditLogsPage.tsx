import { useEffect, useState, useTransition } from "react";
import SearchInput from "../../components/ui/SearchInput.js";
import TableSkeleton from "../../components/shared/TableSkeleton.js";
import {
  DownloadIcon,
  ShieldCheckIcon,
  ExternalLinkIcon,
  XIcon,
} from "../../components/attorney/icons.js";
import { useAuth } from "../../context/AuthContext.js";
import { useToast } from "../../context/ToastContext.js";
import {
  getAuditLogs,
  downloadAuditLogsCsv,
  type AuditLogEntry,
  type AuditFilterOptions,
} from "../../services/auditService.js";

const CATEGORIES = [
  { id: "all", label: "All Activity" },
  { id: "contracts", label: "Contracts" },
  { id: "ai", label: "AI & OCR Engine" },
  { id: "reviews", label: "Attorney Reviews" },
  { id: "statutory", label: "Knowledge Base" },
  { id: "auth", label: "Authentication" },
] as const;

function formatAuditTimestamp(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

function getActionBadge(action: string) {
  switch (action) {
    case "AI_ANALYSIS_COMPLETED":
    case "OCR_PROCESSED":
      return {
        bg: "bg-purple-100 text-purple-800 border-purple-200",
        label: action.replace(/_/g, " "),
      };
    case "REVIEW_COMPLETED":
      return {
        bg: "bg-emerald-100 text-emerald-800 border-emerald-200",
        label: "REVIEW COMPLETED",
      };
    case "FLAG_OVERRIDDEN":
    case "FLAG_REVIEWED":
      return {
        bg: "bg-amber-100 text-amber-800 border-amber-200",
        label: action.replace(/_/g, " "),
      };
    case "CONTRACT_SUBMITTED":
      return {
        bg: "bg-maroon/10 text-maroon border-maroon/20",
        label: "CONTRACT SUBMITTED",
      };
    case "CONTRACT_ASSIGNED":
      return {
        bg: "bg-navy/10 text-navy-deep border-navy/20",
        label: "CONTRACT ASSIGNED",
      };
    case "STATUTORY_SOURCE_DELETED":
      return {
        bg: "bg-rose-100 text-rose-800 border-rose-200",
        label: "STATUTE DELETED",
      };
    case "STATUTORY_SOURCE_CREATED":
    case "STATUTORY_SOURCE_UPDATED":
      return {
        bg: "bg-blue-100 text-blue-800 border-blue-200",
        label: action.replace(/_/g, " "),
      };
    case "USER_LOGIN":
    case "USER_REGISTER":
      return {
        bg: "bg-slate-100 text-slate-700 border-slate-200",
        label: action.replace(/_/g, " "),
      };
    default:
      return {
        bg: "bg-gray-100 text-gray-700 border-gray-200",
        label: action.replace(/_/g, " "),
      };
  }
}

function AuditLogsPage() {
  const { token } = useAuth();
  const { showToast } = useToast();

  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [query, setQuery] = useState("");
  const [selectedCategory, setSelectedCategory] =
    useState<AuditFilterOptions["category"]>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const [activeLog, setActiveLog] = useState<AuditLogEntry | null>(null);

  const [, startTransition] = useTransition();

  useEffect(() => {
    let isMounted = true;

    async function loadLogs() {
      if (!token) return;

      try {
        setIsLoading(true);
        const data = await getAuditLogs(token, {
          q: query,
          category: selectedCategory,
          page: currentPage,
          limit: 20,
        });

        if (isMounted) {
          setLogs(data.logs);
          setTotalPages(data.pages);
          setTotalCount(data.total);
        }
      } catch (err: unknown) {
        if (isMounted) {
          const msg =
            err instanceof Error ? err.message : "Failed to load audit logs.";
          showToast(msg, "warning");
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    const timer = setTimeout(() => {
      loadLogs();
    }, 200);

    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, [token, query, selectedCategory, currentPage, showToast]);

  async function handleExportCsv() {
    if (!token) return;

    try {
      setIsExporting(true);
      showToast("Generating audit trail CSV export...", "info");
      await downloadAuditLogsCsv(token, selectedCategory);
      showToast("Audit logs CSV downloaded successfully!", "success");
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : "Failed to export audit logs.";
      showToast(msg, "warning");
    } finally {
      setIsExporting(false);
    }
  }

  function handleCategoryChange(catId: AuditFilterOptions["category"]) {
    startTransition(() => {
      setSelectedCategory(catId);
      setCurrentPage(1);
    });
  }

  return (
    <div className="flex flex-col gap-6 animate-fade-in-up pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="font-serif text-[28px] font-medium tracking-[-0.01em] text-navy-deep m-0">
              Audit logs
            </h1>
            <span className="inline-flex items-center gap-1 rounded-full border border-navy/20 bg-navy/5 px-2.5 py-0.5 font-mono text-[11px] font-semibold text-navy">
              <ShieldCheckIcon className="h-3 w-3" />
              RA 10173 Audit Trail
            </span>
          </div>
          <p className="mt-1 text-sm text-ink-soft">
            Immutable chain of custody recording document uploads, OCR/RAG AI
            analyses, attorney oversight actions, and system authentication.
          </p>
        </div>

        <button
          type="button"
          onClick={handleExportCsv}
          disabled={isExporting || logs.length === 0}
          className="inline-flex items-center justify-center gap-2 rounded-[6px] border border-line bg-white px-4 py-2 text-xs font-semibold text-navy-deep shadow-2xs hover:bg-parchment hover:border-navy/40 cursor-pointer disabled:opacity-50 transition-colors whitespace-nowrap"
        >
          <DownloadIcon className="h-4 w-4" />
          <span>{isExporting ? "Exporting..." : "Export CSV"}</span>
        </button>
      </div>

      {/* Category Tabs */}
      <div className="flex flex-wrap gap-1.5 border-b border-line pb-2">
        {CATEGORIES.map((cat) => {
          const isActive = selectedCategory === cat.id;
          return (
            <button
              key={cat.id}
              type="button"
              onClick={() => handleCategoryChange(cat.id)}
              className={`rounded-[6px] px-3 py-1.5 text-xs font-medium transition-colors cursor-pointer ${
                isActive
                  ? "bg-navy-deep font-semibold text-parchment shadow-xs"
                  : "bg-white/80 text-ink-soft hover:bg-white hover:text-ink border border-line/60"
              }`}
            >
              {cat.label}
            </button>
          );
        })}
      </div>

      {/* Search Input */}
      <SearchInput
        label="Search audit logs"
        placeholder="Filter by user email, contract request number, action, or IP address..."
        value={query}
        onChange={(event) => {
          setQuery(event.target.value);
          setCurrentPage(1);
        }}
      />

      {/* Table / Skeleton Loading State */}
      {isLoading ? (
        <TableSkeleton rows={6} />
      ) : logs.length === 0 ? (
        <div className="rounded-[8px] border border-line bg-white p-12 text-center shadow-2xs">
          <ShieldCheckIcon className="mx-auto h-8 w-8 text-ink-soft/50" />
          <p className="mt-2 font-serif text-base text-navy-deep m-0">
            No audit logs found.
          </p>
          <p className="mt-1 text-xs text-ink-soft">
            Try adjusting your search keywords or switching category filters.
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-[8px] border border-line bg-white shadow-2xs">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-line bg-[#ECE5D6] text-xs font-semibold tracking-wider text-ink-soft uppercase font-mono">
                <th className="px-5 py-3.5">Timestamp</th>
                <th className="px-4 py-3.5">Action Event</th>
                <th className="px-4 py-3.5">Actor / User</th>
                <th className="px-4 py-3.5">Target Entity</th>
                <th className="px-4 py-3.5">IP &amp; Origin</th>
                <th className="px-4 py-3.5 text-right">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line/60">
              {logs.map((log) => {
                const badge = getActionBadge(log.action);
                return (
                  <tr
                    key={log._id}
                    onClick={() => setActiveLog(log)}
                    className="transition-colors hover:bg-parchment/50 cursor-pointer"
                  >
                    <td className="px-5 py-4 font-mono text-[11.5px] text-ink-soft whitespace-nowrap">
                      {formatAuditTimestamp(log.timestamp)}
                    </td>
                    <td className="px-4 py-4 text-xs">
                      <span
                        className={`inline-block rounded-[4px] border px-2 py-0.5 font-mono text-[10px] font-semibold tracking-wider ${badge.bg}`}
                      >
                        {badge.label}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-xs">
                      <div className="font-semibold text-ink">
                        {log.userName}
                      </div>
                      <div className="font-mono text-[11px] text-ink-soft">
                        {log.userEmail || "system-automated"}
                      </div>
                    </td>
                    <td className="px-4 py-4 text-xs">
                      <div className="font-mono font-medium text-maroon">
                        {log.entityLabel || log.entityId || "—"}
                      </div>
                      <div className="font-mono text-[10.5px] text-ink-soft uppercase">
                        {log.entityType}
                      </div>
                    </td>
                    <td className="px-4 py-4 font-mono text-[11px] text-ink-soft whitespace-nowrap">
                      {log.ipAddress || "local"}
                    </td>
                    <td className="px-4 py-4 text-right">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveLog(log);
                        }}
                        className="inline-flex items-center gap-1 rounded bg-navy/5 px-2.5 py-1 font-mono text-[11px] font-medium text-navy hover:bg-navy/15 cursor-pointer transition-colors"
                      >
                        <span>Inspect</span>
                        <ExternalLinkIcon className="h-3 w-3" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {/* Pagination bar */}
          <div className="flex items-center justify-between border-t border-line bg-parchment/30 px-5 py-3 text-xs">
            <span className="font-mono text-ink-soft">
              Showing {logs.length} of {totalCount} total audit records
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage <= 1}
                className="rounded border border-line bg-white px-3 py-1 font-mono text-ink hover:bg-parchment cursor-pointer disabled:opacity-40"
              >
                Previous
              </button>
              <span className="font-mono text-ink-soft">
                Page {currentPage} of {totalPages || 1}
              </span>
              <button
                type="button"
                onClick={() =>
                  setCurrentPage((p) => Math.min(totalPages, p + 1))
                }
                disabled={currentPage >= totalPages}
                className="rounded border border-line bg-white px-3 py-1 font-mono text-ink hover:bg-parchment cursor-pointer disabled:opacity-40"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════
          AUDIT LOG DETAIL INSPECTION MODAL
          ═══════════════════════════════════════════════════════════ */}
      {activeLog && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-navy-deep/60 p-4 backdrop-blur-xs animate-fade-in-up"
          onClick={() => setActiveLog(null)}
        >
          <div
            className="w-full max-w-xl rounded-[10px] border border-line bg-white p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-start justify-between gap-4 border-b border-line pb-4">
              <div>
                <span className="font-mono text-xs font-bold text-maroon uppercase">
                  {activeLog.action}
                </span>
                <h2 className="font-serif text-xl font-medium text-navy-deep mt-1">
                  Audit Entry Details
                </h2>
                <p className="font-mono text-xs text-ink-soft mt-0.5">
                  Recorded at {formatAuditTimestamp(activeLog.timestamp)}
                </p>
              </div>

              <button
                type="button"
                onClick={() => setActiveLog(null)}
                className="rounded-full p-1 text-ink-soft hover:bg-ink/10 cursor-pointer"
                title="Close"
              >
                <XIcon className="h-5 w-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs mb-4">
              <div className="rounded-[6px] border border-line bg-parchment/40 p-3">
                <span className="block font-mono text-[10px] font-semibold text-ink-soft uppercase">
                  Actor
                </span>
                <span className="font-semibold text-ink text-sm block mt-0.5">
                  {activeLog.userName}
                </span>
                <span className="font-mono text-ink-soft block">
                  {activeLog.userEmail || "N/A"} ({activeLog.userRole})
                </span>
              </div>

              <div className="rounded-[6px] border border-line bg-parchment/40 p-3">
                <span className="block font-mono text-[10px] font-semibold text-ink-soft uppercase">
                  Target Entity
                </span>
                <span className="font-semibold text-ink text-sm block mt-0.5">
                  {activeLog.entityLabel || activeLog.entityId || "N/A"}
                </span>
                <span className="font-mono text-ink-soft block uppercase">
                  Type: {activeLog.entityType}
                </span>
              </div>
            </div>

            {/* Network origin */}
            <div className="rounded-[6px] border border-line bg-parchment/40 p-3 text-xs mb-4">
              <div className="flex items-center justify-between">
                <span className="font-mono text-[10px] font-semibold text-ink-soft uppercase">
                  IP Address:
                </span>
                <span className="font-mono font-medium text-ink">
                  {activeLog.ipAddress || "Local / Unknown"}
                </span>
              </div>
              {activeLog.userAgent && (
                <div className="mt-2 border-t border-line/60 pt-2 font-mono text-[10.5px] text-ink-soft truncate">
                  User Agent: {activeLog.userAgent}
                </div>
              )}
            </div>

            {/* JSON metadata payload */}
            <div>
              <span className="mb-1.5 block font-mono text-[10.5px] font-semibold uppercase text-navy-deep">
                Event Metadata Payload
              </span>
              <pre className="max-h-[220px] overflow-auto rounded-[6px] border border-line bg-navy-deep p-3.5 font-mono text-[11.5px] text-parchment leading-relaxed">
                {JSON.stringify(activeLog.details || {}, null, 2)}
              </pre>
            </div>

            <div className="mt-5 flex justify-end">
              <button
                type="button"
                onClick={() => setActiveLog(null)}
                className="rounded-[5px] bg-navy px-5 py-2 text-xs font-semibold text-parchment hover:bg-navy-deep cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AuditLogsPage;
