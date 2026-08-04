import type { ClauseRiskLevel } from "../../types/clause.js";

const RISK_DOT_CLASSES: Record<ClauseRiskLevel, string> = {
  high: "bg-red-500",
  medium: "bg-amber-500",
  low: "bg-green-500",
};

const RISK_DOT_LABEL: Record<ClauseRiskLevel, string> = {
  high: "High risk",
  medium: "Medium risk",
  low: "Low risk",
};

interface ClauseRiskDotProps {
  riskLevel: ClauseRiskLevel;
}

/** The small colored dot next to each clause in the list — red/amber/green for high/medium/low risk. */
function ClauseRiskDot({ riskLevel }: ClauseRiskDotProps) {
  return (
    <span
      className={`inline-block h-2.5 w-2.5 shrink-0 rounded-full ${RISK_DOT_CLASSES[riskLevel]}`}
      role="img"
      aria-label={RISK_DOT_LABEL[riskLevel]}
    />
  );
}

export default ClauseRiskDot;
