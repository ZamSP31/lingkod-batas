import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import Button from "../../components/ui/Button.js";
import SearchInput from "../../components/ui/SearchInput.js";
import StatutorySourcesTable from "../../components/attorney/StatutorySourcesTable.js";
import { PlusIcon } from "../../components/attorney/icons.js";
import { mockStatutorySources } from "../../mocks/statutoryCorpus.js";
import type { StatutorySource } from "../../types/statutoryCorpus.js";

/**
 * "Statutory corpus" (Fig. 3.27) — the legal sources (Civil Code, Labor
 * Code, etc.) the AI grounds its risk flags and citations against.
 * Lets the attorney browse, search, and add sources so the AI's
 * citations stay verifiable rather than opaque.
 */
function StatutoryCorpusPage() {
  const navigate = useNavigate();
  // TODO: replace with a fetch of GET /api/statutory-sources once the API exists.
  const [sources] = useState<StatutorySource[]>(mockStatutorySources);
  const [query, setQuery] = useState("");

  const filteredSources = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    if (!normalizedQuery) return sources;
    return sources.filter(
      (source) =>
        source.title.toLowerCase().includes(normalizedQuery) ||
        source.category.toLowerCase().includes(normalizedQuery),
    );
  }, [sources, query]);

  function handleOpenSource(source: StatutorySource) {
    // TODO: open a source detail view once that mockup exists; for now, link straight to the source text.
    window.open(source.sourceUrl, "_blank", "noopener,noreferrer");
  }

  function handleAddSource() {
    navigate("/attorney/statutory-corpus/add-source");
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-semibold text-navy-950">
            Statutory corpus
          </h1>
          <p className="mt-1 text-sm text-ink-600">
            Sources used to ground risk flags and citations
          </p>
        </div>
        <Button
          type="button"
          fullWidth={false}
          onClick={handleAddSource}
          className="px-4 py-2.5"
        >
          <PlusIcon className="h-4 w-4" />
          Add source
        </Button>
      </div>

      <SearchInput
        label="Search statutory sources"
        placeholder="Search sources"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
      />

      <StatutorySourcesTable
        sources={filteredSources}
        onOpenSource={handleOpenSource}
      />
    </div>
  );
}

export default StatutoryCorpusPage;
