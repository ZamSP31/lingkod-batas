import EmptyState from "../ui/EmptyState.js";
import { BookOpenIcon, ChevronRightIcon } from "./icons.js";
import { formatShortDate } from "../../utils/format.js";
import type { StatutorySource } from "../../types/statutoryCorpus.js";

interface StatutorySourcesTableProps {
  sources: StatutorySource[];
  onOpenSource: (source: StatutorySource) => void;
}

/**
 * Lists the legal sources (Civil Code, Labor Code, etc.) the AI grounds
 * its risk flags and citations against (Fig. 3.27). Rows are clickable
 * — opening a source lets the attorney verify what the AI is actually
 * citing against, rather than trusting a citation blind.
 */
function StatutorySourcesTable({
  sources,
  onOpenSource,
}: StatutorySourcesTableProps) {
  if (sources.length === 0) {
    return (
      <div className="rounded-xl border border-hairline bg-white">
        <EmptyState
          icon={<BookOpenIcon className="h-6 w-6" />}
          title="No sources found"
          description="Try a different search, or add a new source to the corpus."
        />
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-hairline bg-white">
      <table className="w-full text-left">
        <thead>
          <tr className="border-b border-hairline bg-parchment-50 text-xs font-medium tracking-wide text-ink-400 uppercase">
            <th className="px-4 py-3">Source</th>
            <th className="px-3 py-3">Category</th>
            <th className="px-3 py-3">Last updated</th>
            <th className="w-10 px-3 py-3">
              <span className="sr-only">Open</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {sources.map((source) => (
            <tr
              key={source.id}
              className="border-b border-hairline last:border-b-0 hover:bg-navy-900/[0.02]"
            >
              <td className="max-w-xs px-4 py-3.5">
                <button
                  type="button"
                  onClick={() => onOpenSource(source)}
                  className="text-left text-sm font-medium text-ink-900 hover:text-navy-800 hover:underline"
                >
                  {source.title}
                </button>
              </td>
              <td className="px-3 py-3.5 text-sm whitespace-nowrap text-ink-600">
                {source.category}
              </td>
              <td className="px-3 py-3.5 text-sm whitespace-nowrap text-ink-600">
                {formatShortDate(source.lastUpdatedAt)}
              </td>
              <td className="px-3 py-3.5">
                <button
                  type="button"
                  onClick={() => onOpenSource(source)}
                  aria-label={`Open ${source.title}`}
                  className="rounded-full p-1 text-ink-400 hover:bg-navy-900/5 hover:text-navy-800"
                >
                  <ChevronRightIcon className="h-4 w-4" />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default StatutorySourcesTable;
