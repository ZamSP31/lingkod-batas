import type { ReactNode } from "react";

interface EmptyStateProps {
  icon: ReactNode;
  title: string;
  description: string;
  action?: ReactNode;
}

/**
 * Shown in place of a table/list when there's no data yet — e.g. a
 * client with zero submissions or an attorney with zero pending
 * reviews (test cases D03/D04/MR05). Centralized here so every list
 * screen gets the same empty-state treatment instead of an ad hoc
 * blank space or a raw error.
 */
function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center gap-3 px-6 py-16 text-center">
      <div
        className="flex h-12 w-12 items-center justify-center rounded-full bg-navy-900/5 text-navy-800"
        aria-hidden="true"
      >
        {icon}
      </div>
      <div className="max-w-sm">
        <p className="text-sm font-semibold text-ink-900">{title}</p>
        <p className="mt-1 text-sm text-ink-600">{description}</p>
      </div>
      {action}
    </div>
  );
}

export default EmptyState;
