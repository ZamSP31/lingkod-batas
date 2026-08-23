import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import ClientContractsTable from "../../components/client/ClientContractsTable.js";
import CompletedReportsPanel from "../../components/client/CompletedReportsPanel.js";
import RecentActivityPanel from "../../components/client/RecentActivityPanel.js";
import { mockClientContracts } from "../../mocks/contracts.js";
import { mockNotifications } from "../../mocks/notifications.js";
import { REVIEW_COMPLETE_STATUSES } from "../../types/contract.js";

/**
 * Client "My contracts" dashboard matching Screen 8 of the mockup.
 */
function ClientDashboardPage() {
  const navigate = useNavigate();
  const [contracts] = useState(mockClientContracts);
  const [notifications] = useState(mockNotifications);

  const awaitingReviewCount = useMemo(
    () => contracts.filter((c) => c.status === "awaiting-review").length,
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
    console.log("Download report for", contractId);
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
              <span className="text-[12.5px] text-ink-soft">awaiting attorney review</span>
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

      {/* Contracts Table */}
      <ClientContractsTable
        contracts={contracts}
        onTrackContract={handleTrackContract}
        onViewReport={handleViewReport}
      />

      {/* Bento Grid: Recent Activity & Completed Reports */}
      <div className="mt-8.5 grid grid-cols-1 items-start gap-5 md:grid-cols-[1.7fr_1fr]">
        <RecentActivityPanel notifications={notifications} />
        <CompletedReportsPanel
          contracts={completedContracts}
          onDownload={handleDownloadReport}
        />
      </div>
    </div>
  );
}

export default ClientDashboardPage;