/**
 * Shimmering table skeleton placeholder for loading states.
 */
function TableSkeleton({ rows = 4 }: { rows?: number }) {
  return (
    <div className="overflow-hidden rounded-[8px] border border-line bg-white shadow-2xs">
      <div className="border-b border-line bg-[#ECE5D6] px-5 py-3.5 flex items-center justify-between">
        <div className="h-3.5 w-32 rounded bg-ink/10 skeleton-shimmer" />
        <div className="h-3.5 w-24 rounded bg-ink/10 skeleton-shimmer" />
      </div>
      <div className="divide-y divide-line/60">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="flex items-center justify-between px-5 py-4">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-full bg-ink/5 skeleton-shimmer" />
              <div className="flex flex-col gap-1.5">
                <div className="h-3.5 w-48 rounded bg-ink/10 skeleton-shimmer" />
                <div className="h-2.5 w-28 rounded bg-ink/5 skeleton-shimmer" />
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="h-5 w-20 rounded-full bg-ink/5 skeleton-shimmer" />
              <div className="h-6 w-16 rounded bg-ink/5 skeleton-shimmer" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default TableSkeleton;

