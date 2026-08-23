import { formatRelativeTimestamp } from "../../utils/format.js";
import type { AppNotification } from "../../types/notification.js";

interface RecentActivityPanelProps {
  notifications: AppNotification[];
  limit?: number;
}

/**
 * Recent Activity card matching Screen 8 bento component.
 */
function RecentActivityPanel({
  notifications,
  limit = 4,
}: RecentActivityPanelProps) {
  const visible = notifications.slice(0, limit);

  return (
    <div className="rounded-[8px] border border-line bg-white shadow-2xs">
      <div className="border-b border-line px-[22px] py-[18px]">
        <h3 className="font-serif text-[16.5px] font-medium text-navy-deep m-0">
          Recent activity
        </h3>
      </div>

      {visible.length === 0 ? (
        <p className="px-5 py-8 text-center text-sm text-ink-soft">
          You're all caught up — no recent activity yet.
        </p>
      ) : (
        <ul className="divide-y divide-line">
          {visible.map((notification) => {
            const isAnalysis = notification.type === "analysis-complete";
            const isReady = notification.type === "report-ready";

            return (
              <li
                key={notification.id}
                className="flex items-start gap-[13px] px-[22px] py-4"
              >
                <div
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-parchment ${
                    isAnalysis
                      ? "text-maroon"
                      : isReady
                        ? "text-green"
                        : "text-navy"
                  }`}
                  aria-hidden="true"
                >
                  {isAnalysis ? (
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className="h-3.5 w-3.5">
                      <path d="M9 12L11 14L15 10" strokeLinecap="round" strokeLinejoin="round" />
                      <rect x="4" y="4" width="16" height="16" rx="2" />
                    </svg>
                  ) : isReady ? (
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className="h-3.5 w-3.5">
                      <path d="M12 3V15M12 15L7 10M12 15L17 10" />
                      <path d="M4 17V19A2 2 0 006 21H18A2 2 0 0020 19V17" />
                    </svg>
                  ) : (
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className="h-3.5 w-3.5">
                      <path d="M14 2H6A2 2 0 004 4V20A2 2 0 006 22H18A2 2 0 0020 20V8Z" />
                      <path d="M14 2V8H20" />
                    </svg>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[13px] leading-[1.55] text-ink">
                    {notification.message}
                  </p>
                  <span className="mt-1 block font-mono text-[10.5px] text-ink-soft">
                    {formatRelativeTimestamp(notification.occurredAt)}
                  </span>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

export default RecentActivityPanel;