import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import Button from "../../components/ui/Button.js";
import ContractsTable from "../../components/attorney/ContractsTable.js";
import { UploadCloudIcon } from "../../components/attorney/icons.js";
import { useAuth } from "../../context/AuthContext.js";
import { getAttorneyQueue } from "../../services/attorneyService.js";
import type { ContractSummary } from "../../types/contract.js";

type TabFilter = "all" | "awaiting" | "completed";

/**
 * "My contracts" — the attorney's landing dashboard after login.
 * Lists every contract from MongoDB Atlas with quick tabs for Awaiting Review & Completed.
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

  function handleOpenContract(contractId: string) {
    navigate(`/attorney/review-queue/${contractId}`);
  }

  function handleUploadContract() {
    navigate("/attorney/upload-contract");
  }

  return (
    <div className="flex flex-col">
      {/* Page Header */}
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-serif text-[28px] font-medium tracking-[-0.01em] text-navy-deep">
            Review Queue
          </h1>
          <p className="mt-1.5 text-[13.5px] text-ink-soft">
            <b className="font-semibold text-ink">{contracts.length} total contracts</b> ·{" "}
            {awaitingReviewCount} awaiting review · {completedCount} completed
          </p>
        </div>
        <Button
          type="button"
          fullWidth={false}
          onClick={handleUploadContract}
          className="px-5 py-[11px]"
        >
          <UploadCloudIcon className="h-3.5 w-3.5" />
          Upload contract
        </Button>
      </div>

      {/* Filter Tabs */}
      <div className="mb-4 flex items-center gap-2 border-b border-line pb-2">
        <button
          type="button"
          onClick={() => setActiveTab("all")}
          className={`rounded-[5px] px-3.5 py-1.5 font-mono text-xs font-medium transition-colors cursor-pointer ${
            activeTab === "all"
              ? "bg-navy text-parchment font-semibold shadow-2xs"
              : "text-ink-soft hover:bg-parchment-dark/40 hover:text-ink"
          }`}
        >
          All ({contracts.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("awaiting")}
          className={`rounded-[5px] px-3.5 py-1.5 font-mono text-xs font-medium transition-colors cursor-pointer ${
            activeTab === "awaiting"
              ? "bg-navy text-parchment font-semibold shadow-2xs"
              : "text-ink-soft hover:bg-parchment-dark/40 hover:text-ink"
          }`}
        >
          Awaiting Review ({awaitingReviewCount})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("completed")}
          className={`rounded-[5px] px-3.5 py-1.5 font-mono text-xs font-medium transition-colors cursor-pointer ${
            activeTab === "completed"
              ? "bg-navy text-parchment font-semibold shadow-2xs"
              : "text-ink-soft hover:bg-parchment-dark/40 hover:text-ink"
          }`}
        >
          Completed ({completedCount})
        </button>
      </div>

      {error && (
        <div className="my-4 rounded-[6px] border border-maroon/30 bg-maroon/5 p-3.5 text-xs text-maroon font-mono">
          {error}
        </div>
      )}

      {isLoading ? (
        <div className="my-12 flex justify-center py-8">
          <span className="font-mono text-xs text-ink-soft animate-pulse">
            Loading review queue...
          </span>
        </div>
      ) : (
        <ContractsTable
          contracts={filteredContracts}
          onOpenContract={handleOpenContract}
        />
      )}
    </div>
  );
}

export default AttorneyDashboardPage;
