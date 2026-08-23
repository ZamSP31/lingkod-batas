import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import Button from "../../components/ui/Button.js";
import ContractsTable from "../../components/attorney/ContractsTable.js";
import { UploadCloudIcon } from "../../components/attorney/icons.js";
import { mockAttorneyContracts } from "../../mocks/contracts.js";

/**
 * "My contracts" — the attorney's landing dashboard after login.
 * Lists every contract assigned to this attorney with upload date,
 * high-risk flag count, and review status, sorted by days waiting.
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
    navigate("/attorney/upload-contract");
  }

  return (
    <div className="flex flex-col">
      {/* Page Header */}
      <div className="mb-7 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-serif text-[28px] font-medium tracking-[-0.01em] text-navy-deep">
            My contracts
          </h1>
          <p className="mt-1.5 text-[13.5px] text-ink-soft">
            <b className="font-semibold text-ink">{contracts.length} contracts</b> ·{" "}
            {awaitingReviewCount} awaiting your review · sorted by days waiting, not upload date
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

      <ContractsTable
        contracts={contracts}
        onOpenContract={handleOpenContract}
      />
    </div>
  );
}

export default AttorneyDashboardPage;
