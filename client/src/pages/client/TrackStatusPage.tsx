import StageStepper from "../../components/client/StageStepper.js";
import { mockClientContracts } from "../../mocks/contracts.js";
import {
  stageIndexForStatus,
} from "../../utils/contractStage.js";

/**
 * Client "Track Status" page matching Screen 10 of the mockup.
 */
function TrackStatusPage() {
  const contract =
    mockClientContracts.find(
      (c) => c.status !== "approved" && c.status !== "rejected",
    ) ?? mockClientContracts[0];

  if (!contract) {
    return (
      <div className="max-w-[760px]">
        <p className="font-mono text-sm text-ink-soft">No contracts to track yet.</p>
      </div>
    );
  }

  const stageIndex = stageIndexForStatus(contract.status);

  return (
    <div className="max-w-[760px]">
      <span className="mb-2 block font-mono text-[11.5px] font-medium tracking-[0.06em] text-maroon uppercase">
        Request #{contract.requestNumber} · {contract.title}
      </span>
      <h1 className="font-serif text-[28px] font-medium tracking-[-0.01em] text-navy-deep mb-6.5">
        Track contract review status
      </h1>

      {/* Stepper Card */}
      <div className="rounded-[8px] border border-line bg-white p-7 sm:p-8 shadow-2xs">
        <StageStepper currentStageIndex={stageIndex} />

        <div className="mt-6.5 rounded-[6px] bg-parchment-dark/60 p-4.5 text-[13.5px] leading-[1.6] text-ink-soft">
          <b className="font-semibold text-ink">Your contract passed AI risk analysis</b> and is now in the attorney's review queue. You'll be notified as soon as review begins — no action is needed from you right now.
        </div>
      </div>

      {/* Evidence Card: Redacted Clause Motif */}
      <div className="mt-5.5 rounded-[8px] border border-line bg-white p-7 sm:p-8 shadow-2xs">
        <div className="mb-4.5 flex items-center justify-between">
          <h3 className="font-serif text-[16.5px] font-medium text-navy-deep m-0">
            What the AI found
          </h3>
          <div className="flex gap-3.5 font-mono text-[11px] text-ink-soft">
            <span className="flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-maroon" />
              2 flagged
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-green" />
              4 clear
            </span>
          </div>
        </div>

        <div className="relative overflow-hidden rounded-r-[6px] border-l-[3px] border-maroon bg-parchment p-4.5">
          <p className="font-serif text-[15px] italic leading-[1.7] text-navy-deep blur-[3.5px] select-none m-0">
            "The Employee agrees that all information disclosed shall be treated as <span className="bg-maroon/15 border-b-2 border-maroon px-0.5">confidential indefinitely</span> and the Employer reserves the right to..."
          </p>
        </div>

        <div className="mt-3.5 flex items-center gap-2.5">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.6"
            className="h-4 w-4 shrink-0 text-maroon"
          >
            <path d="M12 2L4 6V12C4 17 7.5 21 12 22C16.5 21 20 17 20 12V6L12 2Z" />
          </svg>
          <span className="text-[12.5px] leading-[1.5] text-ink-soft">
            <b className="font-semibold text-ink">Full clause analysis is sealed for attorney eyes only.</b> Atty. Dela Cruz will confirm, override, or annotate each flag before your report is released.
          </span>
        </div>
      </div>
    </div>
  );
}

export default TrackStatusPage;