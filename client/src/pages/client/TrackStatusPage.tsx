import { useEffect, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import StageStepper from "../../components/client/StageStepper.js";
import CopyButton from "../../components/shared/CopyButton.js";
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
 * Modern Client "Track Status" page matching Lingkod Batas design standards.
 * Displays live stepper and status for the selected or most recent contract,
 * with a prominent celebratory CTA when the review is completed.
 */
function TrackStatusPage() {
  const navigate = useNavigate();
  const { contractId: paramContractId } = useParams<{ contractId?: string }>();
  const [searchParams] = useSearchParams();
  const contractId = paramContractId || searchParams.get("id") || undefined;
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
      <div className="max-w-[780px] py-16 text-center animate-fade-in-up">
        <div className="inline-flex items-center gap-2 rounded-full border border-line bg-white px-4 py-2 text-xs font-mono text-ink-soft shadow-2xs">
          <span className="h-2 w-2 rounded-full bg-navy-deep animate-ping" />
          Synchronizing contract status pipeline…
        </div>
      </div>
    );
  }

  if (!contract) {
    return (
      <div className="max-w-[780px] rounded-2xl border border-line bg-white p-10 text-center shadow-xs animate-fade-in-up">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-parchment text-ink-soft">
          <svg
            className="h-6 w-6 stroke-[1.8]"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
        </div>
        <h2 className="font-serif text-xl font-medium text-navy-deep">
          No contracts active in review
        </h2>
        <p className="mt-2 text-xs text-ink-soft max-w-[380px] mx-auto leading-relaxed">
          When you upload an agreement, its real-time Labor Code screening and
          attorney verification will track here live.
        </p>
        <button
          type="button"
          onClick={() => navigate("/client/submit-contract")}
          className="mt-6 rounded-xl bg-maroon px-5 py-2.5 text-xs font-semibold uppercase tracking-wider text-parchment hover:bg-maroon-bright transition-all shadow-xs cursor-pointer"
        >
          Submit a contract
        </button>
      </div>
    );
  }

  const stageIndex = stageIndexForStatus(contract.status) ?? 0;
  const isCompleted = stageIndex === 4 || contract.status === "approved";
  const statusMessage =
    STAGE_STATUS_MESSAGES[stageIndex] ||
    "Your contract is currently being processed by the system.";

  return (
    <div className="max-w-[780px] pb-12 animate-fade-in-up">
      {/* Header & Meta Pill */}
      <div className="mb-2 flex items-center gap-2">
        <span className="font-mono text-[11px] font-semibold tracking-wider text-maroon uppercase">
          Case ID #{contract.requestNumber} · {contract.title}
        </span>
        <CopyButton text={contract.requestNumber} label="Copy ID" />
      </div>
      <h1 className="font-serif text-[28px] font-medium tracking-tight text-navy-deep mb-6">
        Contract review progress
      </h1>

      {/* Main Stepper Card */}
      <div className="rounded-2xl border border-line bg-white p-7 sm:p-8 shadow-xs">
        <StageStepper currentStageIndex={stageIndex} />

        <div className="mt-8 rounded-xl border border-line bg-parchment/40 p-4.5 text-xs leading-relaxed text-ink-soft flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 flex-1 min-w-[240px]">
            <span className="h-2 w-2 rounded-full bg-gold shrink-0" />
            <span>{statusMessage}</span>
          </div>

          {isCompleted && (
            <button
              type="button"
              onClick={() => navigate(`/client/contract-report/${contract.id}`)}
              className="rounded-lg bg-maroon px-4 py-2 text-xs font-semibold uppercase tracking-wider text-parchment hover:bg-maroon-bright transition-all cursor-pointer shrink-0 shadow-2xs"
            >
              View Report →
            </button>
          )}
        </div>
      </div>

      {/* Conditional Cards based on Completion */}
      {isCompleted ? (
        /* Celebratory Legal Report Ready Card */
        <div className="mt-6 rounded-2xl border border-green/30 bg-green/5 p-7 sm:p-8 shadow-xs">
          <div className="flex flex-wrap items-center justify-between gap-5">
            <div>
              <div className="flex items-center gap-2.5">
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-green text-xs font-bold text-white shadow-2xs">
                  ✓
                </span>
                <h3 className="font-serif text-lg font-medium text-navy-deep m-0">
                  Verified Legal Advisory Report Released
                </h3>
              </div>
              <p className="mt-2 text-xs leading-relaxed text-ink-soft max-w-[480px] m-0">
                Atty. Danielito Jimenez ("Pinoy Street Lawyer") has completed
                the legal review of{" "}
                <strong className="text-ink font-semibold">
                  {contract.title}
                </strong>
                , applied statutory findings, and certified the final advisory
                report.
              </p>
            </div>
            <button
              type="button"
              onClick={() => navigate(`/client/contract-report/${contract.id}`)}
              className="rounded-xl bg-maroon px-6 py-3 text-xs font-semibold uppercase tracking-wider text-parchment shadow-xs hover:bg-maroon-bright transition-all cursor-pointer"
            >
              View Advisory Report →
            </button>
          </div>
        </div>
      ) : (
        /* Evidence Card: Redacted Clause Motif while under review */
        <div className="mt-6 rounded-2xl border border-line bg-white p-7 sm:p-8 shadow-xs">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-serif text-base font-semibold text-navy-deep m-0">
              Automated Labor Code Screening
            </h3>
            <div className="flex items-center gap-1.5 font-mono text-[11px] text-ink-soft">
              <span className="h-1.5 w-1.5 rounded-full bg-maroon animate-pulse" />
              <span>Attorney Gatekeeping Active</span>
            </div>
          </div>

          <div className="relative overflow-hidden rounded-r-xl border-l-4 border-maroon bg-parchment/60 p-5">
            <p className="font-serif text-[14px] italic leading-[1.7] text-navy-deep blur-[3px] select-none m-0">
              "The Employee agrees that all proprietary developments,
              disclosures, and non-competition duties shall remain binding for
              twenty-four (24) months post-termination across the entire
              National Capital Region..."
            </p>
          </div>

          <div className="mt-4 flex items-start gap-2.5 pt-2">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              className="h-4 w-4 shrink-0 text-maroon mt-0.5"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"
              />
            </svg>
            <span className="text-xs leading-relaxed text-ink-soft">
              <strong className="font-semibold text-ink">
                Raw AI clause ratings are gated behind attorney gatekeeping.
              </strong>{" "}
              In compliance with Philippine legal ethics, Atty. Danielito
              Jimenez personally reviews, overrides, and approves all findings
              before the advisory report is released to you.
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

export default TrackStatusPage;
