import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import Button from "../../components/ui/Button.js";
import ContractsTable from "../../components/attorney/ContractsTable.js";
import { UploadCloudIcon } from "../../components/attorney/icons.js";
import { mockAttorneyContracts } from "../../mocks/contracts.js";

/**
 * "My contracts" — the attorney's landing dashboard after login.
 * Lists every contract assigned to this attorney with upload date,
 * high-risk flag count, and review status (Fig. 3.24 / D02 test case).
 */
function AttorneyDashboardPage() {
  const navigate = useNavigate();
  // TODO: replace with a fetch of GET /api/contracts?attorneyId=me once the API exists.
  const [contracts] = useState(mockAttorneyContracts);

  const awaitingReviewCount = useMemo(
    () => contracts.filter((c) => c.status === "awaiting-review").length,
    [contracts],
  );

  function handleOpenContract(contractId: string) {
    navigate(`/attorney/review-queue/${contractId}`);
  }

  function handleUploadContract() {
    // TODO: open the Upload Contract flow (Fig. 3.25) once that page exists.
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-semibold text-navy-950">
            My contracts
          </h1>
          <p className="mt-1 text-sm text-ink-600">
            {contracts.length} contracts, {awaitingReviewCount} awaiting your
            review
          </p>
        </div>
        <Button
          type="button"
          fullWidth={false}
          onClick={handleUploadContract}
          className="px-4 py-2.5"
        >
          <UploadCloudIcon className="h-4 w-4" />
          Upload contract
        </Button>
      </div>

      <ContractsTable
        contracts={contracts}
        onOpenContract={handleOpenContract}
      />
    </div>
  );
}

export default AttorneyDashboardPage;
