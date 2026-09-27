import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import ContractsTable from "../../components/attorney/ContractsTable.js";
import TableSkeleton from "../../components/shared/TableSkeleton.js";
import RecentActivityPanel from "../../components/client/RecentActivityPanel.js";
import CompletedReportsPanel from "../../components/client/CompletedReportsPanel.js";
import { UploadCloudIcon } from "../../components/attorney/icons.js";
import { useAuth } from "../../context/AuthContext.js";
import { getAttorneyQueue } from "../../services/attorneyService.js";
import type {
  ContractSummary,
  ClientContractSummary,
} from "../../types/contract.js";
import type { AppNotification } from "../../types/notification.js";

type TabFilter = "all" | "awaiting" | "completed";

/**
 * "My contracts" — the attorney's landing dashboard after login.
 * Lists every contract from MongoDB Atlas with quick tabs for Awaiting Review & Completed,
 * stat counters, live activity stream, and finalized reports.
 */
function AttorneyDashboardPage() {
  const navigate = useNavigate();
  const { token } = useAuth();
  const [contracts, setContracts] = useState<ContractSummary[]>([]);
  const [activeTab, setActiveTab] = useState<TabFilter>("all");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function loadQueue() {
      if (!token) {
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        setError(null);
        const data = await getAttorneyQueue(token);
        if (isMounted) {
          setContracts(data);
        }
      } catch (err: unknown) {
        if (isMounted) {
          const message =
            err instanceof Error ? err.message : "Failed to load review queue.";
          setError(message);
          setContracts([]);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    loadQueue();

    return () => {
      isMounted = false;
    };
  }, [token]);

  const awaitingReviewCount = useMemo(
    () =>
      contracts.filter(
        (c) => c.status === "awaiting-review" || c.status === "under-review",
      ).length,
    [contracts],
  );

  const completedCount = useMemo(
    () => contracts.filter((c) => c.status === "approved").length,
    [contracts],
  );

  const filteredContracts = useMemo(() => {
    if (activeTab === "awaiting") {
      return contracts.filter(
        (c) => c.status === "awaiting-review" || c.status === "under-review",
      );
    }
    if (activeTab === "completed") {
      return contracts.filter((c) => c.status === "approved");
    }
    return contracts;
  }, [contracts, activeTab]);

  const completedReports: ClientContractSummary[] = useMemo(
    () =>
      contracts
        .filter((c) => c.status === "approved")
        .map((c) => ({
          id: c.id,
          title: c.title,
          requestNumber: c.id.slice(-6).toUpperCase(),
          uploadedAt: c.uploadedAt,
          status: c.status,
        })),
    [contracts],
  );

  function handleOpenContract(contractId: string) {
    navigate(`/attorney/review-queue/${contractId}`);
  }

  function handleUploadContract() {
    navigate("/attorney/upload-contract");
  }

  function handleDownloadReport(contractId: string) {
    navigate(`/client/contract-report/${contractId}`);
  }

  const format2Digits = (n: number) => (n < 10 ? `0${n}` : `${n}`);

  return (
    <div className="flex flex-col animate-fade-in-up">
      {/* Page Header with Stat Strip */}
      <div className="mb-4 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-serif text-[28px] font-medium tracking-[-0.01em] text-navy-deep mb-2">
            My contracts
          </h1>
          <div className="flex flex-wrap items-center gap-5.5">
            <div className="flex items-baseline gap-1.5">
              <span className="font-mono text-[17px] font-semibold text-navy-deep">
                {format2Digits(contracts.length)}
              </span>
              <span className="text-[12.5px] text-ink-soft">
                total docketed
              </span>
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="font-mono text-[17px] font-semibold text-maroon">
                {format2Digits(awaitingReviewCount)}
              </span>
              <span className="text-[12.5px] text-ink-soft">
                awaiting review
              </span>
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="font-mono text-[17px] font-semibold text-green">
                {format2Digits(completedCount)}
              </span>
              <span className="text-[12.5px] text-ink-soft">completed</span>
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={handleUploadContract}
          className="flex items-center gap-2 rounded-xl bg-maroon px-5 py-[11px] text-[13.5px] font-semibold text-parchment transition-all hover:bg-maroon-bright shadow-xs hover:shadow cursor-pointer"
        >
          <UploadCloudIcon className="h-3.5 w-3.5" />
          <span>Upload contract</span>
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="mb-3 flex items-center justify-between gap-4 border-b border-line pb-3">
        <div className="flex items-center gap-1.5 rounded-xl bg-parchment-dark/40 p-1 border border-line/60">
          <button
            type="button"
            onClick={() => setActiveTab("all")}
            className={`rounded-lg px-3.5 py-1.5 font-mono text-xs font-semibold transition-all cursor-pointer ${
              activeTab === "all"
                ? "bg-navy-deep text-parchment shadow-xs"
                : "text-ink-soft hover:text-ink hover:bg-white/60"
            }`}
          >
            All ({contracts.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("awaiting")}
            className={`rounded-lg px-3.5 py-1.5 font-mono text-xs font-semibold transition-all cursor-pointer ${
              activeTab === "awaiting"
                ? "bg-navy-deep text-parchment shadow-xs"
                : "text-ink-soft hover:text-ink hover:bg-white/60"
            }`}
          >
            Awaiting Review ({awaitingReviewCount})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("completed")}
            className={`rounded-lg px-3.5 py-1.5 font-mono text-xs font-semibold transition-all cursor-pointer ${
              activeTab === "completed"
                ? "bg-navy-deep text-parchment shadow-xs"
                : "text-ink-soft hover:text-ink hover:bg-white/60"
            }`}
          >
            Completed ({completedCount})
          </button>
        </div>

        <span className="font-mono text-[11px] text-ink-soft hidden sm:inline-block">
          Counsel Queue · Labor Standards Division
        </span>
      </div>

      {error && (
        <div className="my-4 rounded-xl border border-maroon/30 bg-maroon/5 p-4 text-xs text-maroon font-mono">
          {error}
        </div>
      )}

      {/* Contracts Table / Skeleton State */}
      {isLoading ? (
        <div className="my-3">
          <TableSkeleton rows={4} />
        </div>
      ) : (
        <ContractsTable
          contracts={filteredContracts}
          onOpenContract={handleOpenContract}
        />
      )}

      {/* Bento Grid: Recent Review Activity & Completed Reports */}
      <div className="mt-8.5 grid grid-cols-1 items-start gap-5 md:grid-cols-[1.7fr_1fr]">
        <RecentActivityPanel
          notifications={
            contracts.length === 0
              ? []
              : ([
                  {
                    id: "att-act-1",
                    type: "contract-submitted",
                    message: `Contract "${contracts[0]?.title}" docketed for statutory assessment.`,
                    occurredAt:
                      contracts[0]?.uploadedAt || new Date().toISOString(),
                    read: false,
                  },
                  ...(contracts.length > 1
                    ? [
                        {
                          id: "att-act-2",
                          type: "analysis-complete",
                          message: `AI statutory analysis generated for "${contracts[1]?.title}".`,
                          occurredAt:
                            contracts[1]?.uploadedAt ||
                            new Date().toISOString(),
                          read: true,
                        },
                      ]
                    : []),
                ] as AppNotification[])
          }
        />
        <CompletedReportsPanel
          contracts={completedReports}
          onDownload={handleDownloadReport}
        />
      </div>
    </div>
  );
}

export default AttorneyDashboardPage;
