import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Button from "../../components/ui/Button.js";
import SearchInput from "../../components/ui/SearchInput.js";
import TableSkeleton from "../../components/shared/TableSkeleton.js";
import {
  PlusIcon,
  EditIcon,
  TrashIcon,
  ExternalLinkIcon,
  FileIcon,
} from "../../components/attorney/icons.js";
import { useAuth } from "../../context/AuthContext.js";
import { useToast } from "../../context/ToastContext.js";
import {
  getStatutorySources,
  deleteStatutorySource,
  type BackendStatutorySource,
} from "../../services/kbService.js";
import { formatShortDate } from "../../utils/format.js";

/**
 * Statutory Corpus Page.
 * Displays live Philippine Labor Code articles, DOLE issuances, and Supreme Court doctrines
 * fetched directly from MongoDB Atlas. Allows full text inspection, document download,
 * and complete CRUD operations (Create, Read, Update, Delete).
 */
function StatutoryCorpusPage() {
  const navigate = useNavigate();
  const { token } = useAuth();
  const { showToast } = useToast();

  const [sources, setSources] = useState<BackendStatutorySource[]>([]);
  const [query, setQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeSource, setActiveSource] =
    useState<BackendStatutorySource | null>(null);
  const [deletingSource, setDeletingSource] =
    useState<BackendStatutorySource | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function loadSources() {
      if (!token) return;

      try {
        setIsLoading(true);
        setError(null);
        const data = await getStatutorySources(token, query);
        if (isMounted) {
          setSources(data);
        }
      } catch (err: unknown) {
        if (isMounted) {
          const msg =
            err instanceof Error
              ? err.message
              : "Failed to load statutory sources.";
          setError(msg);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    const timer = setTimeout(() => {
      loadSources();
    }, 250);

    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, [token, query]);

  function handleAddSource() {
    navigate("/attorney/statutory-corpus/add-source");
  }

  function handleEditSource(id: string, e?: React.MouseEvent) {
    if (e) e.stopPropagation();
    navigate(`/attorney/statutory-corpus/edit/${id}`);
  }

  async function handleConfirmDelete() {
    if (!deletingSource || !token) return;

    try {
      setIsDeleting(true);
      await deleteStatutorySource(deletingSource._id, token);
      setSources((prev) => prev.filter((s) => s._id !== deletingSource._id));
      if (activeSource?._id === deletingSource._id) {
        setActiveSource(null);
      }
      showToast(
        `Deleted "${deletingSource.citation}" from statutory corpus.`,
        "success",
      );
      setDeletingSource(null);
    } catch (err: unknown) {
      const msg =
        err instanceof Error
          ? err.message
          : "Failed to delete statutory source.";
      showToast(msg, "warning");
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <div className="flex flex-col gap-6 animate-fade-in-up pb-12">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="font-serif text-[28px] font-medium tracking-[-0.01em] text-navy-deep">
            Statutory corpus
          </h1>
          <p className="mt-1 text-sm text-ink-soft">
            Live Philippine Labor Code, DOLE orders, and jurisprudence used to
            ground AI risk flags.
          </p>
        </div>
        <Button
          type="button"
          fullWidth={false}
          onClick={handleAddSource}
          className="px-4 py-2.5 bg-maroon hover:bg-maroon-bright text-parchment"
        >
          <PlusIcon className="h-4 w-4" />
          Add source
        </Button>
      </div>

      {/* Search Input */}
      <SearchInput
        label="Search statutory sources"
        placeholder="Search by article, citation, or legal keywords..."
        value={query}
        onChange={(event) => setQuery(event.target.value)}
      />

      {error && (
        <div className="rounded-[6px] border border-maroon/30 bg-maroon/5 p-3.5 text-xs text-maroon">
          {error}
        </div>
      )}

      {/* Table / Skeleton Loading State */}
      {isLoading ? (
        <TableSkeleton rows={5} />
      ) : sources.length === 0 ? (
        <div className="rounded-[8px] border border-line bg-white p-12 text-center shadow-2xs">
          <p className="font-serif text-base text-navy-deep m-0">
            No statutory sources match your query.
          </p>
          <p className="mt-1 text-xs text-ink-soft">
            Try searching for terms like "overtime", "wage", "non-compete", or
            "termination".
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-[8px] border border-line bg-white shadow-2xs">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-line bg-[#ECE5D6] text-xs font-semibold tracking-wider text-ink-soft uppercase font-mono">
                <th className="px-5 py-3.5">Citation &amp; Title</th>
                <th className="px-4 py-3.5">Source Type</th>
                <th className="px-4 py-3.5">Category Tag</th>
                <th className="px-4 py-3.5">Document</th>
                <th className="px-4 py-3.5">Last Updated</th>
                <th className="px-4 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line/60">
              {sources.map((source) => (
                <tr
                  key={source._id}
                  onClick={() => setActiveSource(source)}
                  className="transition-colors hover:bg-parchment/50 cursor-pointer"
                >
                  <td className="px-5 py-4 max-w-sm">
                    <div className="font-mono text-xs font-semibold text-maroon">
                      {source.citation}
                    </div>
                    <div className="font-serif text-[14px] font-medium text-ink mt-0.5">
                      {source.title}
                    </div>
                  </td>
                  <td className="px-4 py-4 text-xs">
                    <span className="rounded-full bg-navy/10 px-2.5 py-1 font-mono text-[10px] font-medium text-navy uppercase">
                      {source.sourceType.replace(/_/g, " ")}
                    </span>
                  </td>
                  <td className="px-4 py-4 text-xs font-mono text-ink-soft">
                    {source.tags?.[0]
                      ? source.tags[0].replace(/_/g, " ")
                      : "general"}
                  </td>
                  <td className="px-4 py-4 text-xs whitespace-nowrap">
                    {source.fileUrl ? (
                      <a
                        href={source.fileUrl}
                        target="_blank"
                        rel="noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="inline-flex items-center gap-1 rounded bg-navy/5 px-2 py-0.5 font-mono text-[11px] font-medium text-navy hover:bg-navy/15 hover:underline"
                        title={source.fileName || "View attached PDF"}
                      >
                        <FileIcon className="h-3 w-3" />
                        <span>PDF</span>
                        <ExternalLinkIcon className="h-2.5 w-2.5 opacity-70" />
                      </a>
                    ) : (
                      <span className="font-mono text-[11px] text-ink-soft opacity-40">
                        —
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-4 text-xs font-mono text-ink-soft whitespace-nowrap">
                    {formatShortDate(source.updatedAt || source.createdAt)}
                  </td>
                  <td className="px-4 py-4 text-right whitespace-nowrap">
                    <div className="inline-flex items-center gap-1">
                      <button
                        type="button"
                        onClick={(e) => handleEditSource(source._id, e)}
                        className="rounded p-1.5 text-ink-soft hover:bg-navy/10 hover:text-navy cursor-pointer transition-colors"
                        title="Edit statutory source"
                      >
                        <EditIcon className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setDeletingSource(source);
                        }}
                        className="rounded p-1.5 text-ink-soft hover:bg-maroon/10 hover:text-maroon cursor-pointer transition-colors"
                        title="Delete statutory source"
                      >
                        <TrashIcon className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════
          FULL STATUTORY PROVISION INSPECTION MODAL
          ═══════════════════════════════════════════════════════════ */}
      {activeSource && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-navy-deep/60 p-4 backdrop-blur-xs animate-fade-in-up"
          onClick={() => setActiveSource(null)}
        >
          <div
            className="w-full max-w-2xl rounded-[10px] border border-line bg-white p-7 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-start justify-between gap-4 border-b border-line pb-4">
              <div>
                <span className="font-mono text-xs font-bold text-maroon uppercase">
                  {activeSource.citation}
                </span>
                <h2 className="font-serif text-xl font-medium text-navy-deep mt-1">
                  {activeSource.title}
                </h2>
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <span className="rounded-full bg-navy/10 px-2.5 py-0.5 font-mono text-[10px] text-navy uppercase">
                    {activeSource.sourceType.replace(/_/g, " ")}
                  </span>
                  {activeSource.tags?.map((tag) => (
                    <span
                      key={tag}
                      className="rounded-full bg-parchment px-2.5 py-0.5 font-mono text-[10px] text-ink-soft uppercase"
                    >
                      {tag.replace(/_/g, " ")}
                    </span>
                  ))}
                  {activeSource.fileUrl && (
                    <a
                      href={activeSource.fileUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 rounded-full bg-navy/10 px-2.5 py-0.5 font-mono text-[10px] text-navy hover:underline"
                    >
                      <FileIcon className="h-3 w-3" />
                      <span>{activeSource.fileName || "View Document"}</span>
                      <ExternalLinkIcon className="h-2.5 w-2.5" />
                    </a>
                  )}
                </div>
              </div>

              <button
                type="button"
                onClick={() => setActiveSource(null)}
                className="rounded-full p-1 text-ink-soft hover:bg-ink/10 cursor-pointer"
                title="Close"
              >
                <svg
                  className="h-5 w-5"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M18 6L6 18M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Verbatim Provision Text */}
            <div className="max-h-[380px] overflow-y-auto rounded-[6px] border border-line/70 bg-parchment/40 p-5 text-ink leading-relaxed">
              <span className="mb-2 block font-mono text-[10.5px] font-semibold text-navy uppercase">
                Verbatim Statutory Provision:
              </span>
              <p className="font-serif text-[14.5px] leading-[1.7] text-[#2c2822] whitespace-pre-wrap m-0">
                {activeSource.provisionText}
              </p>
            </div>

            <div className="mt-5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleEditSource(activeSource._id)}
                  className="inline-flex items-center gap-1.5 rounded-[5px] border border-line bg-white px-3.5 py-2 text-xs font-semibold text-ink hover:border-navy hover:text-navy cursor-pointer transition-colors"
                >
                  <EditIcon className="h-3.5 w-3.5" />
                  Edit provision
                </button>
                <button
                  type="button"
                  onClick={() => setDeletingSource(activeSource)}
                  className="inline-flex items-center gap-1.5 rounded-[5px] border border-maroon/30 bg-maroon/5 px-3.5 py-2 text-xs font-semibold text-maroon hover:bg-maroon/15 cursor-pointer transition-colors"
                >
                  <TrashIcon className="h-3.5 w-3.5" />
                  Delete
                </button>
              </div>

              <button
                type="button"
                onClick={() => setActiveSource(null)}
                className="rounded-[5px] bg-navy px-5 py-2 text-xs font-semibold text-parchment hover:bg-navy-deep cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════
          DELETE CONFIRMATION MODAL
          ═══════════════════════════════════════════════════════════ */}
      {deletingSource && (
        <div
          className="fixed inset-0 z-60 flex items-center justify-center bg-navy-deep/70 p-4 backdrop-blur-xs animate-fade-in-up"
          onClick={() => setDeletingSource(null)}
        >
          <div
            className="w-full max-w-md rounded-[10px] border border-maroon/30 bg-white p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 text-maroon">
              <div className="rounded-full bg-maroon/10 p-2.5">
                <TrashIcon className="h-6 w-6" />
              </div>
              <h3 className="font-serif text-lg font-semibold text-navy-deep m-0">
                Delete statutory source?
              </h3>
            </div>

            <p className="mt-3 text-xs leading-relaxed text-ink-soft">
              Are you sure you want to delete{" "}
              <strong className="text-ink font-semibold">
                "{deletingSource.citation}: {deletingSource.title}"
              </strong>
              ? This action will permanently remove it from the database and AI
              knowledge base.
            </p>

            <div className="mt-5 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setDeletingSource(null)}
                disabled={isDeleting}
                className="rounded-[5px] border border-line bg-white px-4 py-2 text-xs font-medium text-ink hover:bg-parchment cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={isDeleting}
                className="rounded-[5px] bg-maroon px-4 py-2 text-xs font-semibold text-parchment hover:bg-maroon-bright cursor-pointer disabled:opacity-50"
              >
                {isDeleting ? "Deleting..." : "Delete permanently"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default StatutoryCorpusPage;
