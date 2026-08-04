import { useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import ClauseList from "../../components/attorney/ClauseList.js";
import ClauseDetailPanel from "../../components/attorney/ClauseDetailPanel.js";
import { getClauseReview } from "../../mocks/clauseReviews.js";

/**
 * The clause-by-clause AI-flagged review interface (Fig. 3.26). Lists
 * every clause the AI extracted from the contract on the left; the
 * right panel shows the quoted text, rationale, and legal citation for
 * whichever clause is selected, defaulting to the first one so the
 * panel is never empty on load.
 */
function ReviewQueuePage() {
  const { contractId } = useParams<{ contractId: string }>();
  // TODO: replace with a fetch of GET /api/contracts/:id/clauses once the AI-analysis endpoint exists.
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

  return (
    <div className="flex flex-col gap-6">
      <div>
        <p className="text-sm text-ink-400">{review.contractTypeLabel}</p>
        <h1 className="font-display text-2xl font-semibold text-navy-950">
          {review.fileName} · {review.clauses.length} clauses
        </h1>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-[280px_1fr]">
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
