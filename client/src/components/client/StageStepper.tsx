const STAGES = [
  { num: "01", label: "OCR processing" },
  { num: "02", label: "AI analysis" },
  { num: "03", label: "Awaiting attorney review" },
  { num: "04", label: "Under review" },
  { num: "05", label: "Completed" },
];

interface StageStepperProps {
  currentStageIndex: number; // 0-indexed (e.g. 2 for "Awaiting attorney review")
}

/**
 * 5-Stage progress tracker matching Screen 10 of the mockup.
 */
function StageStepper({ currentStageIndex }: StageStepperProps) {
  return (
    <div className="flex items-start w-full">
      {STAGES.map((stage, idx) => {
        const isDone = idx < currentStageIndex;
        const isCurrent = idx === currentStageIndex;

        return (
          <div key={stage.num} className="relative flex-1 text-center">
            {/* Connector line */}
            {idx > 0 && (
              <div
                className={`absolute top-[19px] -left-[calc(50%-19px)] w-[calc(100%-38px)] h-[2px] -z-0 ${
                  isDone ? "bg-green" : "bg-line"
                }`}
              />
            )}

            {/* Circle */}
            <div
              className={`relative z-10 mx-auto mb-2.5 flex h-[38px] w-[38px] items-center justify-center rounded-full border-2 font-mono text-[13px] font-semibold ${
                isDone
                  ? "border-green bg-green text-white"
                  : isCurrent
                    ? "border-maroon bg-white text-maroon"
                    : "border-line bg-white text-ink-soft"
              }`}
            >
              {isDone ? "✓" : stage.num}
            </div>

            {/* Label */}
            <div
              className={`text-[12px] font-semibold leading-tight ${
                isDone || isCurrent ? "text-ink" : "text-ink-soft opacity-70"
              }`}
            >
              <span className="font-mono text-[11px] block">{stage.num}</span>
              {stage.label}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default StageStepper;