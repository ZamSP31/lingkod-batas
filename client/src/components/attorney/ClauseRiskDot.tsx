import type { ClauseRiskLevel } from "../../types/clause.js";

const RISK_CONFIG: Record<
  ClauseRiskLevel,
  { dotColor: string; label: string; textColor: string }
> = {
  high: {
    dotColor: "bg-maroon",
    label: "High-risk",
    textColor: "text-maroon",
  },
  medium: {
    dotColor: "bg-maroon/80",
    label: "Medium-risk",
    textColor: "text-maroon",
  },
  low: {
    dotColor: "bg-green",
    label: "Clear",
    textColor: "text-green",
  },
};

interface ClauseRiskDotProps {
  riskLevel: ClauseRiskLevel;
  showLabel?: boolean;
}

/**
 * A risk indicator pairing a dot with mono text label, adhering to
 * Lingkod Batas design rules.
 */
function ClauseRiskDot({ riskLevel, showLabel = true }: ClauseRiskDotProps) {
  const config = RISK_CONFIG[riskLevel];

  return (
    <span
      className={`inline-flex items-center gap-1.5 font-mono text-[11px] font-medium tracking-[0.02em] ${config.textColor}`}
    >
      <span
        className={`inline-block h-[7px] w-[7px] shrink-0 rounded-full ${config.dotColor}`}
        aria-hidden="true"
      />
      {showLabel && <span>{config.label}</span>}
    </span>
  );
}

export default ClauseRiskDot;
