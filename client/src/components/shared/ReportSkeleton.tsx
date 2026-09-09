/**
 * Shimmering legal report skeleton placeholder for loading states.
 */
function ReportSkeleton() {
  return (
    <div className="max-w-[820px] pb-12 animate-fade-in-up">
      {/* Header Skeleton */}
      <div className="mb-6 border-b border-line pb-6 flex justify-between items-end">
        <div className="flex flex-col gap-2.5">
          <div className="h-3.5 w-44 rounded bg-ink/10 skeleton-shimmer" />
          <div className="h-7 w-72 rounded bg-ink/15 skeleton-shimmer" />
          <div className="h-3 w-56 rounded bg-ink/5 skeleton-shimmer" />
        </div>
        <div className="h-10 w-36 rounded bg-ink/10 skeleton-shimmer" />
      </div>

      {/* Metadata Table Skeleton */}
      <div className="mb-6 rounded-[8px] border border-line bg-white p-5">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex flex-col gap-1.5">
              <div className="h-2.5 w-16 rounded bg-ink/5 skeleton-shimmer" />
              <div className="h-4 w-28 rounded bg-ink/10 skeleton-shimmer" />
            </div>
          ))}
        </div>
      </div>

      {/* Clause Cards Skeleton */}
      <div className="flex flex-col gap-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="rounded-[8px] border border-line bg-white p-6 flex flex-col gap-3">
            <div className="flex justify-between">
              <div className="h-4 w-32 rounded bg-ink/10 skeleton-shimmer" />
              <div className="h-4 w-24 rounded bg-ink/5 skeleton-shimmer" />
            </div>
            <div className="h-16 w-full rounded bg-parchment-dark/40 skeleton-shimmer" />
            <div className="h-3 w-3/4 rounded bg-ink/10 skeleton-shimmer" />
          </div>
        ))}
      </div>
    </div>
  );
}

export default ReportSkeleton;

