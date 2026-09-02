import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import ClientContractsTable from "../../components/client/ClientContractsTable.js";
import CompletedReportsPanel from "../../components/client/CompletedReportsPanel.js";
import RecentActivityPanel from "../../components/client/RecentActivityPanel.js";
import { useAuth } from "../../context/AuthContext.js";
import { getClientContracts } from "../../services/contractService.js";
import { REVIEW_COMPLETE_STATUSES } from "../../types/contract.js";
import type { ClientContractSummary } from "../../types/contract.js";

/**
 * Client "My contracts" dashboard matching Screen 8 of the mockup.
 * Fetches real contracts for the logged-in client; displays clean empty state if new.
 */
function ClientDashboardPage() {
  const navigate = useNavigate();
  const { token } = useAuth();
  const [contracts, setContracts] = useState<ClientContractSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function loadContracts() {
      if (!token) {
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        setError(null);
        const data = await getClientContracts(token);
        if (isMounted) {
          setContracts(data);
        }
      } catch (err: unknown) {
        if (isMounted) {
          const message =
            err instanceof Error ? err.message : "Failed to load contracts.";
          setError(message);
          setContracts([]);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    loadContracts();

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

  const completedContracts = useMemo(
    () => contracts.filter((c) => REVIEW_COMPLETE_STATUSES.includes(c.status)),
    [contracts],
  );

  function handleSubmitContract() {
    navigate("/client/submit-contract");
  }

  function handleTrackContract(contractId: string) {
    navigate(`/client/track-status/${contractId}`);
  }

  function handleViewReport(contractId: string) {
    navigate(`/client/contract-report/${contractId}`);
  }

  function handleDownloadReport(contractId: string) {
    navigate(`/client/contract-report/${contractId}`);
  }

  const format2Digits = (n: number) => (n < 10 ? `0${n}` : `${n}`);

  return (
    <div className="flex flex-col">
      {/* Page Header with Stat Strip */}
      <div className="mb-2.5 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-serif text-[28px] font-medium tracking-[-0.01em] text-navy-deep mb-2">
            My contracts
          </h1>
          <div className="flex flex-wrap items-center gap-5.5">
            <div className="flex items-baseline gap-1.5">
              <span className="font-mono text-[17px] font-semibold text-navy-deep">
                {format2Digits(contracts.length)}
              </span>
              <span className="text-[12.5px] text-ink-soft">submitted</span>
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="font-mono text-[17px] font-semibold text-navy-deep">
                {format2Digits(awaitingReviewCount)}
              </span>
              <span className="text-[12.5px] text-ink-soft">
                awaiting attorney review
              </span>
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="font-mono text-[17px] font-semibold text-navy-deep">
                {format2Digits(completedContracts.length)}
              </span>
              <span className="text-[12.5px] text-ink-soft">completed</span>
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={handleSubmitContract}
          className="flex items-center gap-2 rounded-[5px] bg-maroon px-5 py-[11px] text-[13.5px] font-semibold text-parchment transition-colors hover:bg-maroon-bright cursor-pointer"
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            className="h-3.5 w-3.5"
          >
            <path d="M12 3V15M12 3L7 8M12 3L17 8" />
            <path d="M4 17V19A2 2 0 006 21H18A2 2 0 0020 19V17" />
          </svg>
          Submit contract
        </button>
      </div>

      {error && (
        <div className="my-4 rounded-[6px] border border-maroon/30 bg-maroon/5 p-3.5 text-xs text-maroon">
          {error}
        </div>
      )}

      {/* New Report Notification Banner */}
      {completedContracts.length > 0 && (
        <div className="mb-4 mt-3 rounded-[8px] border border-green/35 bg-green/[0.05] p-4 flex flex-wrap items-center justify-between gap-3 shadow-2xs">
          <div className="flex items-center gap-2.5">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-green text-xs font-bold text-white shrink-0">
              ✓
            </span>
            <span className="text-sm text-ink">
              <b>Review Complete:</b> Atty. Jimenez has finalized and released
              your report for <b>{completedContracts[0]?.title}</b>.
            </span>
          </div>
          <button
            type="button"
            onClick={() => handleViewReport(completedContracts[0]?.id || "")}
            className="rounded-[4px] bg-green px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-green/90 transition-colors cursor-pointer"
          >
            Open Report →
          </button>
        </div>
      )}

      {/* Contracts Table / Empty State */}
      {isLoading ? (
        <div className="my-10 flex justify-center py-8">
          <span className="font-mono text-xs text-ink-soft animate-pulse">
            Loading your contracts...
          </span>
        </div>
      ) : (
        <ClientContractsTable
          contracts={contracts}
          onTrackContract={handleTrackContract}
          onViewReport={handleViewReport}
        />
      )}

      {/* Bento Grid: Recent Activity & Completed Reports */}
      <div className="mt-8.5 grid grid-cols-1 items-start gap-5 md:grid-cols-[1.7fr_1fr]">
        <RecentActivityPanel
          notifications={
            contracts.length === 0
              ? []
              : [
                  {
                    id: "act-1",
                    type: "contract-submitted",
                    message: `Submitted ${contracts[0]?.title} for review.`,
                    occurredAt:
                      contracts[0]?.uploadedAt || new Date().toISOString(),
                    read: false,
                  },
                ]
          }
        />
        <CompletedReportsPanel
          contracts={completedContracts}
          onDownload={handleDownloadReport}
        />
      </div>
    </div>
  );
}

export default ClientDashboardPage;
