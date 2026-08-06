import StageStepper from "../../components/client/StageStepper.js";
import { mockClientContracts } from "../../mocks/contracts.js";
import {
  stageIndexForStatus,
  STAGE_STATUS_MESSAGES,
} from "../../utils/contractStage.js";

/** The client's step-by-step view of where their most recent contract sits in the review pipeline. */
function TrackStatusPage() {
  const contract =
    mockClientContracts.find(
      (c) => c.status !== "approved" && c.status !== "rejected",
    ) ?? mockClientContracts[0];

  if (!contract) {
    return (
      <div className="mx-auto max-w-4xl">
        <p className="text-sm text-ink-400">No contracts to track yet.</p>
      </div>
    );
  }

  const stageIndex = stageIndexForStatus(contract.status);
  const statusMessage = STAGE_STATUS_MESSAGES[stageIndex];

  return (
    <div className="mx-auto max-w-4xl">
      <h1 className="text-xl font-semibold text-ink-900">
        Track contract review status
      </h1>
      <p className="mt-1 text-sm text-ink-400">
        Request #{contract.requestNumber} · {contract.title}
      </p>

      <div className="mt-6 rounded-2xl border border-hairline bg-white p-6">
        <StageStepper currentStageIndex={stageIndex} />

        <div className="mt-6 rounded-xl bg-parchment-100 px-4 py-3">
          <p className="text-sm leading-relaxed text-ink-600">
            {statusMessage}
          </p>
        </div>
      </div>
    </div>
  );
}

export default TrackStatusPage;