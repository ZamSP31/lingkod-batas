import { useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import ClauseList from "../../components/attorney/ClauseList.js";
import ClauseDetailPanel from "../../components/attorney/ClauseDetailPanel.js";
import { getClauseReview } from "../../mocks/clauseReviews.js";

/**
 * The clause-by-clause AI-flagged review interface matching Screen 5 (Review Queue).
 */
function ReviewQueuePage() {
  const { contractId } = useParams<{ contractId: string }>();
  const review = useMemo(
    () => getClauseReview(contractId ?? "c-1002"),
    [contractId],
  );

  const [selectedClauseId, setSelectedClauseId] = useState(
    review.clauses[0]?.id ?? "",
  );

  const selectedClause =
    review.clauses.find((clause) => clause.id === selectedClauseId) ??
    review.clauses[0];

  const highCount = review.clauses.filter((c) => c.riskLevel === "high").length;
  const mediumCount = review.clauses.filter((c) => c.riskLevel === "medium").length;
  const clearCount = review.clauses.filter((c) => c.riskLevel === "low").length;

  return (
    <div className="flex flex-col">
      {/* Document Header */}
      <div className="mb-7">
        <span className="mb-2 block font-mono text-[11.5px] font-medium tracking-[0.06em] text-maroon uppercase">
          {review.contractTypeLabel}
        </span>
        <div className="flex flex-wrap items-baseline justify-between gap-4">
          <h1 className="font-serif text-[28px] font-medium tracking-[-0.01em] text-navy-deep">
            {review.fileName} · {review.clauses.length} clauses
          </h1>
          <div className="flex items-center gap-4 text-[12.5px] text-ink-soft">
            <span className="flex items-center gap-1.5 font-mono text-xs">
              <span className="h-[7px] w-[7px] rounded-full bg-maroon" />
              {highCount} high-risk
            </span>
            <span className="flex items-center gap-1.5 font-mono text-xs">
              <span className="h-[7px] w-[7px] rounded-full bg-gold" />
              {mediumCount} medium
            </span>
            <span className="flex items-center gap-1.5 font-mono text-xs">
              <span className="h-[7px] w-[7px] rounded-full bg-green" />
              {clearCount} clear
            </span>
          </div>
        </div>
      </div>

      {/* 2-Column Review Grid */}
      <div className="grid grid-cols-1 items-start gap-[22px] md:grid-cols-[320px_1fr]">
        <ClauseList
          clauses={review.clauses}
          selectedClauseId={selectedClauseId}
          onSelectClause={setSelectedClauseId}
        />

        {selectedClause && <ClauseDetailPanel clause={selectedClause} />}
      </div>
    </div>
  );
}

export default ReviewQueuePage;
