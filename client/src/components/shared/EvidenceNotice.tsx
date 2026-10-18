import type { ContractClause } from "../../types/clause.js";
import { evidenceNotice, screeningContext } from "../../utils/assessment.js";

export default function EvidenceNotice({ clause }: { clause: ContractClause }) {
  const message = evidenceNotice(clause);
  const context = screeningContext(clause);
  if (!message && !context) return null;
  return <div>{context && <p className="mb-3 text-xs text-ink-soft print:text-black">{context}</p>}{message && <p className="mb-4 rounded-lg border border-gold/40 bg-gold/10 p-3 text-sm text-ink print:border-gray-400 print:bg-white print:text-black">{message}</p>}</div>;
}
