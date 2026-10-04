import { useEffect, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { Clock, ShieldCheck, FileText, Lock, Plus } from "lucide-react";
import StageStepper from "../../components/client/StageStepper.js";
import CopyButton from "../../components/shared/CopyButton.js";
import { useAuth } from "../../context/AuthContext.js";
import {
  getClientContracts,
  getContractById,
  getContractStatus,
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

  // Live polling: auto-update contract status every 4 seconds while review pipeline is active
  useEffect(() => {
    if (!contract?.id || !token) return;
    if (contract.status === "approved") return;

    const interval = setInterval(async () => {
      try {
        const update = await getContractStatus(contract.id, token);
        const mappedStatus = mapBackendStatus(update.status);
        setContract((prev) => {
          if (!prev) return null;
          if (prev.status !== mappedStatus) {
            return { ...prev, status: mappedStatus };
          }
          return prev;
        });
      } catch {
        // Silent catch during background polling
      }
    }, 4000);

    return () => clearInterval(interval);
  }, [contract?.id, contract?.status, token]);

  if (isLoading) {
    return (
      <div className="w-full max-w-7xl mx-auto py-16 text-center animate-fade-in-up">
        <div className="inline-flex items-center gap-2 rounded-full border border-line bg-white px-5 py-2.5 text-xs font-mono text-ink-soft shadow-2xs">
          <span className="h-2 w-2 rounded-full bg-navy-deep animate-ping" />
          Synchronizing contract status pipeline…
        </div>
      </div>
    );
  }

  if (!contract) {
    return (
      <div className="w-full max-w-7xl mx-auto pb-12 animate-fade-in-up">
        {/* Header */}
        <div className="mb-6 flex flex-wrap items-end justify-between gap-4 border-b border-line pb-5">
          <div>
            <h1 className="font-serif text-[28px] font-medium tracking-tight text-navy-deep mb-1">
              Contract review tracking
            </h1>
            <p className="text-xs text-ink-soft leading-relaxed">
              Real-time multi-stage monitoring for your submitted employment contracts.
            </p>
          </div>
          <button
            type="button"
            onClick={() => navigate("/client/submit-contract")}
            className="flex items-center gap-2 rounded-xl bg-maroon px-5 py-2.5 text-xs font-semibold uppercase tracking-wider text-parchment hover:bg-maroon-bright transition-all shadow-xs cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Submit a contract</span>
          </button>
        </div>

        {/* Hero Empty State Banner */}
        <div className="rounded-2xl border border-line bg-white p-8 sm:p-12 text-center shadow-xs">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-parchment text-maroon shadow-2xs">
            <FileText className="h-7 w-7 stroke-[1.8]" />
          </div>
          <h2 className="font-serif text-2xl font-medium text-navy-deep">
            No contracts active in review
          </h2>
          <p className="mt-2 text-sm text-ink-soft max-w-[520px] mx-auto leading-relaxed">
            When you upload an agreement, its real-time Labor Code screening, clause segmentation, and attorney verification will track here live.
          </p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <button
              type="button"
              onClick={() => navigate("/client/submit-contract")}
              className="rounded-xl bg-maroon px-6 py-3 text-xs font-semibold uppercase tracking-wider text-parchment hover:bg-maroon-bright transition-all shadow-xs cursor-pointer"
            >
              Submit a contract for review
            </button>
            <button
              type="button"
              onClick={() => navigate("/client")}
              className="rounded-xl border border-line bg-white px-5 py-3 text-xs font-semibold text-ink-soft hover:bg-parchment/60 hover:text-ink transition-all shadow-2xs cursor-pointer"
            >
              Back to dashboard
            </button>
          </div>
        </div>

        {/* 3 Full-Width Cards to Maximize Space */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-5">
          <div className="rounded-2xl border border-line bg-white p-6 shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-navy-deep/5 text-navy-deep mb-3.5">
                <Clock className="w-5 h-5 text-navy-deep" />
              </div>
              <h3 className="font-serif text-base font-semibold text-navy-deep mb-1.5">
                5-Stage Pipeline
              </h3>
              <p className="text-xs text-ink-soft leading-relaxed">
                From initial upload and automatic PII sanitization to statutory AI analysis and licensed attorney certification, you can observe every step live.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-line/60 flex items-center gap-1.5 text-[11px] font-mono font-medium text-maroon">
              <span>Average turnaround: 24–48 hours</span>
            </div>
          </div>

          <div className="rounded-2xl border border-line bg-white p-6 shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700 mb-3.5">
                <ShieldCheck className="w-5 h-5 text-emerald-600" />
              </div>
              <h3 className="font-serif text-base font-semibold text-navy-deep mb-1.5">
                Human-in-the-Loop Review
              </h3>
              <p className="text-xs text-ink-soft leading-relaxed">
                In strict compliance with Philippine legal ethics, AI only pre-screens clauses. Atty. Danielito Jimenez personally validates every flag before report release.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-line/60 flex items-center gap-1.5 text-[11px] font-mono font-medium text-emerald-700">
              <span>Verified Counsel Sign-Off</span>
            </div>
          </div>

          <div className="rounded-2xl border border-line bg-white p-6 shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gold/10 text-gold mb-3.5">
                <Lock className="w-5 h-5 text-navy-deep" />
              </div>
              <h3 className="font-serif text-base font-semibold text-navy-deep mb-1.5">
                RA 10173 Privacy Protected
              </h3>
              <p className="text-xs text-ink-soft leading-relaxed">
                Your name, employer identifiers, and confidential credentials are automatically stripped before analysis. Your documents are never used to train public AI models.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-line/60 flex items-center gap-1.5 text-[11px] font-mono font-medium text-navy-deep">
              <span>Zero Model Retention</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const stageIndex = stageIndexForStatus(contract.status) ?? 0;
  const isCompleted = stageIndex === 4 || contract.status === "approved";
  const statusMessage =
    STAGE_STATUS_MESSAGES[stageIndex] ||
    "Your contract is currently being processed by the system.";

  return (
    <div className="w-full max-w-7xl mx-auto pb-12 animate-fade-in-up">
      {/* Header & Meta Pill */}
      <div className="mb-2 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="font-mono text-[11px] font-semibold tracking-wider text-maroon uppercase">
            Case ID #{contract.requestNumber} · {contract.title}
          </span>
          <CopyButton text={contract.requestNumber} label="Copy ID" />
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => navigate("/client")}
            className="text-xs text-ink-soft hover:text-ink font-medium transition-colors cursor-pointer"
          >
            ← Back to My Contracts
          </button>
        </div>
      </div>

      <h1 className="font-serif text-[28px] font-medium tracking-tight text-navy-deep mb-6">
        Contract review progress
      </h1>

      {/* Responsive 2-Column Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Main Column: Stepper & Active/Completed Status Cards (8 cols) */}
        <div className="lg:col-span-8 space-y-6">
          {/* Main Stepper Card */}
          <div className="rounded-2xl border border-line bg-white p-7 sm:p-8 shadow-xs">
            <StageStepper currentStageIndex={stageIndex} />

            <div className="mt-8 rounded-xl border border-line bg-parchment/40 p-4.5 text-xs leading-relaxed text-ink-soft flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2.5 flex-1 min-w-[240px]">
                <span className="h-2 w-2 rounded-full bg-gold shrink-0 animate-pulse" />
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
            <div className="rounded-2xl border border-green/30 bg-green/5 p-7 sm:p-8 shadow-xs">
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
                  <p className="mt-2 text-xs leading-relaxed text-ink-soft max-w-[540px] m-0">
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
            <div className="rounded-2xl border border-line bg-white p-7 sm:p-8 shadow-xs">
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

        {/* Sidebar Column: Contract Summary & Reviewing Counsel (4 cols) */}
        <div className="lg:col-span-4 space-y-6">
          {/* Contract Overview Card */}
          <div className="rounded-2xl border border-line bg-white p-6 shadow-xs">
            <h3 className="font-serif text-sm font-semibold text-navy-deep mb-4 pb-3 border-b border-line">
              Contract Details
            </h3>
            <dl className="space-y-3 text-xs">
              <div className="flex justify-between items-center">
                <dt className="text-ink-soft">Tracking Number</dt>
                <dd className="font-mono font-medium text-navy-deep">{contract.requestNumber}</dd>
              </div>
              <div className="flex justify-between items-center">
                <dt className="text-ink-soft">Contract Title</dt>
                <dd className="font-medium text-ink truncate max-w-[180px] text-right" title={contract.title}>
                  {contract.title}
                </dd>
              </div>
              <div className="flex justify-between items-center">
                <dt className="text-ink-soft">Review Status</dt>
                <dd>
                  <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium ${
                    isCompleted
                      ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-600/20"
                      : "bg-gold/15 text-navy-deep ring-1 ring-gold/30"
                  }`}>
                    <span className={`h-1.5 w-1.5 rounded-full ${isCompleted ? "bg-emerald-500" : "bg-gold animate-pulse"}`} />
                    {isCompleted ? "Report Released" : "Processing"}
                  </span>
                </dd>
              </div>
              <div className="flex justify-between items-center">
                <dt className="text-ink-soft">Statutory Scope</dt>
                <dd className="text-ink font-medium">Labor Code of the Phils.</dd>
              </div>
            </dl>
          </div>

          {/* Assigned Reviewing Counsel Card */}
          <div className="rounded-2xl border border-line bg-white p-6 shadow-xs">
            <div className="flex items-center gap-3 mb-3.5">
              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-gold text-navy-deep font-bold text-sm shadow-xs ring-2 ring-white">
                DJ
              </div>
              <div>
                <h4 className="font-serif text-sm font-semibold text-navy-deep leading-tight">
                  Atty. Danielito Jimenez
                </h4>
                <p className="text-[11px] text-ink-soft mt-0.5">
                  IBP Roll No. 67890 · Verified Counsel
                </p>
              </div>
            </div>
            <p className="text-xs text-ink-soft leading-relaxed">
              Supervising Attorney conducting human-in-the-loop statutory compliance audits on all flagged clauses.
            </p>
          </div>

          {/* Privacy & Trust Badge */}
          <div className="rounded-2xl border border-line bg-parchment/40 p-5 shadow-2xs">
            <div className="flex items-start gap-2.5">
              <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-xs font-semibold text-navy-deep">
                  RA 10173 Protected
                </h4>
                <p className="mt-1 text-[11px] leading-relaxed text-ink-soft">
                  PII sanitized before analysis. Encrypted in transit and rest. Zero AI model training on client documents.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default TrackStatusPage;
