import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import StageStepper from "../../components/client/StageStepper.js";
import { useAuth } from "../../context/AuthContext.js";
import {
  getClientContracts,
  getContractById,
  mapBackendStatus,
} from "../../services/contractService.js";
import {
  stageIndexForStatus,
  STAGE_STATUS_MESSAGES,
} from "../../utils/contractStage.js";
import type { ContractStatus } from "../../types/contract.js";

interface ActiveContract {
  id: string;
  title: string;
  requestNumber: string;
  status: ContractStatus;
}

/**
 * Client "Track Status" page matching Screen 10 of the mockup.
 * Displays live stepper and status for the selected or most recent contract.
 */
function TrackStatusPage() {
  const navigate = useNavigate();
  const { contractId } = useParams<{ contractId?: string }>();
  const { token } = useAuth();
  const [contract, setContract] = useState<ActiveContract | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    async function loadTrackData() {
      if (!token) {
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        if (contractId) {
          const doc = await getContractById(contractId, token);
          if (isMounted) {
            setContract({
              id: doc._id,
              title: doc.title,
              requestNumber: doc.requestNumber,
              status: mapBackendStatus(doc.status),
            });
          }
        } else {
          // Default to the most recent contract
          const list = await getClientContracts(token);
          if (isMounted) {
            if (list.length > 0 && list[0]) {
              setContract(list[0]);
            } else {
              setContract(null);
            }
          }
        }
      } catch {
        if (isMounted) {
          setContract(null);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    loadTrackData();

    return () => {
      isMounted = false;
    };
  }, [contractId, token]);

  if (isLoading) {
    return (
      <div className="max-w-[760px] py-12 text-center">
        <span className="font-mono text-xs text-ink-soft animate-pulse">
          Loading contract status...
        </span>
      </div>
    );
  }

  if (!contract) {
    return (
      <div className="max-w-[760px] rounded-[8px] border border-line bg-white p-10 text-center shadow-2xs">
        <h2 className="font-serif text-xl font-medium text-navy-deep">
          No contracts to track yet
        </h2>
        <p className="mt-2 text-sm text-ink-soft">
          When you upload an agreement, you'll be able to follow its real-time
          review progress here.
        </p>
        <button
          type="button"
          onClick={() => navigate("/client/submit-contract")}
          className="mt-6 rounded-[6px] bg-maroon px-5 py-2.5 text-sm font-semibold text-parchment hover:bg-maroon-bright cursor-pointer"
        >
          Submit your first contract
        </button>
      </div>
    );
  }

  const stageIndex = stageIndexForStatus(contract.status) ?? 0;
  const statusMessage =
    STAGE_STATUS_MESSAGES[stageIndex] ||
    "Your contract is currently being processed by the system.";

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
          {statusMessage}
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
              Clause analysis active
            </span>
          </div>
        </div>

        <div className="relative overflow-hidden rounded-r-[6px] border-l-[3px] border-maroon bg-parchment p-4.5">
          <p className="font-serif text-[15px] italic leading-[1.7] text-navy-deep blur-[3.5px] select-none m-0">
            "The Employee agrees that all information disclosed shall be treated
            as{" "}
            <span className="bg-maroon/15 border-b-2 border-maroon px-0.5">
              confidential indefinitely
            </span>{" "}
            and the Employer reserves the right to..."
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
            <b className="font-semibold text-ink">
              Full clause analysis is sealed for attorney eyes only.
            </b>{" "}
            Your assigned reviewing attorney will confirm, override, or annotate
            each flag before your report is released.
          </span>
        </div>
      </div>
    </div>
  );
}

export default TrackStatusPage;
