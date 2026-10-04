import { useState } from "react";
import { Filter, CheckCircle2, AlertTriangle, ShieldCheck } from "lucide-react";
import type { ContractClause } from "../../types/clause.js";

interface ClauseListProps {
  clauses: ContractClause[];
  selectedClauseId: string;
  onSelectClause: (clauseId: string) => void;
}

const RISK_MAP = {
  high: { label: "High", textClass: "text-maroon", dotClass: "bg-maroon" },
  medium: { label: "Medium", textClass: "text-gold", dotClass: "bg-gold" },
  low: { label: "Clear", textClass: "text-green", dotClass: "bg-green" },
};

type FilterMode = "all" | "needs_review" | "high" | "reviewed";

/**
 * Modern clause selector list on the left side of the Review Queue.
 * Features fast triaging filters and independent scroll container so attorneys
 * don't need to scroll the entire window down.
 */
function ClauseList({
  clauses,
  selectedClauseId,
  onSelectClause,
}: ClauseListProps) {
  const [filterMode, setFilterMode] = useState<FilterMode>("all");

  const unreviewedCount = clauses.filter(
    (c) => c.attorneyStatus === "pending",
  ).length;
  const highCount = clauses.filter((c) => c.riskLevel === "high").length;
  const reviewedCount = clauses.filter(
    (c) =>
      c.attorneyStatus === "approved" || c.attorneyStatus === "overridden",
  ).length;

  const filteredClauses = clauses.filter((clause) => {
    if (filterMode === "needs_review") {
      return clause.attorneyStatus === "pending";
    }
    if (filterMode === "high") {
      return clause.riskLevel === "high";
    }
    if (filterMode === "reviewed") {
      return (
        clause.attorneyStatus === "approved" ||
        clause.attorneyStatus === "overridden"
      );
    }
    return true;
  });

  return (
    <div className="overflow-hidden rounded-2xl border border-line bg-white shadow-xs flex flex-col">
      {/* Triage Filter Header */}
      <div className="border-b border-line bg-parchment/40 p-2.5">
        <div className="flex items-center gap-1.5 mb-2 px-1">
          <Filter className="w-3.5 h-3.5 text-ink-soft" />
          <span className="font-mono text-[10.5px] uppercase tracking-wider font-semibold text-ink-soft">
            Clauses ({filteredClauses.length} of {clauses.length})
          </span>
        </div>
        <div className="grid grid-cols-2 gap-1 sm:flex sm:flex-wrap">
          <button
            type="button"
            onClick={() => setFilterMode("all")}
            className={`rounded-lg px-2.5 py-1 text-xs font-medium transition-all cursor-pointer ${
              filterMode === "all"
                ? "bg-navy-deep text-white shadow-2xs font-semibold"
                : "bg-white/80 text-ink-soft hover:bg-white hover:text-ink border border-line/60"
            }`}
          >
            All ({clauses.length})
          </button>
          <button
            type="button"
            onClick={() => setFilterMode("needs_review")}
            className={`rounded-lg px-2.5 py-1 text-xs font-medium transition-all cursor-pointer flex items-center gap-1 ${
              filterMode === "needs_review"
                ? "bg-maroon text-white shadow-2xs font-semibold"
                : "bg-white/80 text-ink-soft hover:bg-white hover:text-maroon border border-line/60"
            }`}
          >
            <span>Needs Review</span>
            <span className="rounded-full bg-black/10 px-1 py-0.2 text-[10px] font-mono">
              {unreviewedCount}
            </span>
          </button>
          <button
            type="button"
            onClick={() => setFilterMode("high")}
            className={`rounded-lg px-2.5 py-1 text-xs font-medium transition-all cursor-pointer flex items-center gap-1 ${
              filterMode === "high"
                ? "bg-maroon text-white shadow-2xs font-semibold"
                : "bg-white/80 text-ink-soft hover:bg-white hover:text-maroon border border-line/60"
            }`}
          >
            <AlertTriangle className="w-3 h-3 text-maroon" />
            <span>High ({highCount})</span>
          </button>
          <button
            type="button"
            onClick={() => setFilterMode("reviewed")}
            className={`rounded-lg px-2.5 py-1 text-xs font-medium transition-all cursor-pointer flex items-center gap-1 ${
              filterMode === "reviewed"
                ? "bg-emerald-700 text-white shadow-2xs font-semibold"
                : "bg-white/80 text-ink-soft hover:bg-white hover:text-emerald-700 border border-line/60"
            }`}
          >
            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
            <span>Reviewed ({reviewedCount})</span>
          </button>
        </div>
      </div>

      {/* Independently Scrollable Clause List */}
      <div className="overflow-y-auto max-h-[calc(100vh-250px)] divide-y divide-line">
        {filteredClauses.length === 0 ? (
          <div className="p-6 text-center text-xs text-ink-soft">
            <ShieldCheck className="w-6 h-6 mx-auto mb-2 text-emerald-600 opacity-60" />
            <p className="font-medium text-navy-deep">No clauses in this filter</p>
            <p className="mt-0.5 text-[11px]">
              {filterMode === "needs_review"
                ? "All clauses have been reviewed!"
                : "Try selecting a different filter above."}
            </p>
          </div>
        ) : (
          <ul className="divide-y divide-line">
            {filteredClauses.map((clause) => {
              const isSelected = clause.id === selectedClauseId;
              const risk = RISK_MAP[clause.riskLevel] || RISK_MAP.low;
              const isReviewed =
                clause.attorneyStatus === "approved" ||
                clause.attorneyStatus === "overridden";

              return (
                <li key={clause.id}>
                  <button
                    type="button"
                    onClick={() => onSelectClause(clause.id)}
                    aria-current={isSelected}
                    className={`flex w-full items-start justify-between gap-3 border-l-[3px] px-3.5 py-3 text-left transition-colors cursor-pointer ${
                      isSelected
                        ? "border-l-maroon bg-maroon/[0.04]"
                        : "border-l-transparent hover:bg-parchment/60"
                    }`}
                  >
                    <div className="min-w-0 flex-1">
                      {/* Clause Title */}
                      <div className="text-[13px] font-semibold text-ink leading-snug line-clamp-1">
                        {clause.title}
                      </div>

                      {/* Subtitle with Clause Number and Review Status Tag */}
                      <div className="mt-1 flex flex-wrap items-center gap-1.5 font-mono text-[11px] text-ink-soft">
                        <span>Clause {clause.clauseNumber}</span>

                        {isReviewed && (
                          <>
                            <span className="text-line">•</span>
                            <span
                              className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                                clause.attorneyStatus === "approved"
                                  ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-600/20"
                                  : "bg-navy/8 text-navy"
                              }`}
                            >
                              <CheckCircle2 className="h-2.5 w-2.5 text-emerald-600" />
                              {clause.attorneyStatus === "approved"
                                ? "Reviewed"
                                : "Overridden"}
                            </span>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Risk Level Badge */}
                    <div
                      className={`mt-0.5 flex items-center gap-1.5 font-mono text-[10.5px] font-semibold tracking-wider uppercase shrink-0 ${risk.textClass}`}
                    >
                      <span
                        className={`h-[7px] w-[7px] rounded-full ${risk.dotClass}`}
                      />
                      {risk.label}
                    </div>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}

export default ClauseList;
