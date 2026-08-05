import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import Button from "../../components/ui/Button.js";
import ClientContractsTable from "../../components/client/ClientContractsTable.js";
import CompletedReportsPanel from "../../components/client/CompletedReportsPanel.js";
import RecentActivityPanel from "../../components/client/RecentActivityPanel.js";
import { PlusIcon } from "../../components/attorney/icons.js";
import { mockClientContracts } from "../../mocks/contracts.js";
import { mockNotifications } from "../../mocks/notifications.js";
import { REVIEW_COMPLETE_STATUSES } from "../../types/contract.js";

/**
 * "My contracts" — the client's landing dashboard after login (Fig.
 * 3.29). Lists every contract the client has submitted with upload
 * date and review stage, plus quick-access panels for finalized
 * reports and recent activity.
 */
function ClientDashboardPage() {
  const navigate = useNavigate();
  // TODO: replace with a fetch of GET /api/contracts?clientId=me and
  // GET /api/notifications once those endpoints exist.
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
    navigate(`/client/contracts/${contractId}/report`);
  }

  function handleDownloadReport(contractId: string) {
    // TODO: wire to GET /api/contracts/:id/report once the API exists.
    console.log("Download report for", contractId);
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-semibold text-navy-950">
            My contracts
          </h1>
          <p className="mt-1 text-sm text-ink-600">
            {contracts.length} contracts submitted, {awaitingReviewCount}{" "}
            awaiting attorney review
          </p>
        </div>
        <Button
          type="button"
          fullWidth={false}
          onClick={handleSubmitContract}
          className="px-4 py-2.5"
        >
          <PlusIcon className="h-4 w-4" />
          Submit contract
        </Button>
      </div>

      <ClientContractsTable
        contracts={contracts}
        onTrackContract={handleTrackContract}
        onViewReport={handleViewReport}
      />

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <CompletedReportsPanel
          contracts={completedContracts}
          onDownload={handleDownloadReport}
        />
        <RecentActivityPanel notifications={notifications} />
      </div>
    </div>
  );
}

export default ClientDashboardPage;