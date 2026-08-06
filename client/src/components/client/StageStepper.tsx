import { REVIEW_STAGE_LABELS } from "../../utils/contractStage.js";

interface StageStepperProps {
  /** 0-based index of the pipeline's current or most recently reached stage. */
  currentStageIndex: number;
}

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 20 20" fill="none" className={className} aria-hidden="true">
      <path
        d="M4 10.5 8 14.5 16 6.5"
        stroke="currentColor"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/** Horizontal 5-step progress tracker for the client's contract review pipeline. */
function StageStepper({ currentStageIndex }: StageStepperProps) {
  return (
    <div className="mx-auto flex max-w-2xl items-start justify-between">
      {REVIEW_STAGE_LABELS.map((label, index) => {
        const isCompleted = index < currentStageIndex;
        const isCurrent = index === currentStageIndex;
        const isLast = index === REVIEW_STAGE_LABELS.length - 1;

        return (
          <div key={label} className="flex flex-1 items-start last:flex-none">
            <div className="flex flex-col items-center">
              <div
                className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-2 text-sm font-semibold ${
                  isCompleted
                    ? "border-navy-900 bg-navy-900 text-parchment-100"
                    : isCurrent
                      ? "border-navy-900 bg-parchment-100 text-navy-900"
                      : "border-hairline bg-parchment-50 text-ink-400"
                }`}
              >
                {isCompleted ? <CheckIcon className="h-4 w-4" /> : index + 1}
              </div>
              <span
                className={`mt-2 w-24 text-center text-xs leading-snug ${
                  isCurrent
                    ? "font-semibold text-navy-900"
                    : isCompleted
                      ? "text-navy-900"
                      : "text-ink-400"
                }`}
              >
                {label}
              </span>
            </div>

            {!isLast && (
              <div
                className={`mt-[18px] h-0.5 flex-1 ${
                  isCompleted ? "bg-navy-900" : "bg-hairline"
                }`}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

export default StageStepper;