import {
  ActivityIcon,
  DocumentIcon,
  DownloadIcon,
  UserIcon,
} from "../shared/icons.js";
import { formatRelativeTimestamp } from "../../utils/format.js";
import type { AppNotification, NotificationType } from "../../types/notification.js";

const TYPE_ICON: Record<NotificationType, typeof DocumentIcon> = {
  "contract-submitted": DocumentIcon,
  "analysis-complete": ActivityIcon,
  "attorney-reviewing": UserIcon,
  "report-ready": DownloadIcon,
};

interface RecentActivityPanelProps {
  notifications: AppNotification[];
  /** Caps how many show inline — the bell icon in the topbar covers the rest. */
  limit?: number;
}

/**
 * "Recent activity" panel on the client dashboard (Fig. 3.29) — a
 * short inline preview of the same data NotificationsMenu shows in the
 * topbar dropdown, so a client doesn't need to open the bell to catch
 * up on the latest couple of events.
 */
function RecentActivityPanel({
  notifications,
  limit = 3,
}: RecentActivityPanelProps) {
  const visible = notifications.slice(0, limit);

  return (
    <div>
      <h2 className="mb-2 text-sm font-semibold text-ink-900">
        Recent Activity
      </h2>

      <div className="rounded-xl border border-hairline bg-white">
        {visible.length === 0 ? (
          <p className="px-5 py-8 text-center text-sm text-ink-400">
            You're all caught up — no notifications yet.
          </p>
        ) : (
          <ul>
            {visible.map((notification) => {
              const Icon = TYPE_ICON[notification.type];
              return (
                <li
                  key={notification.id}
                  className="flex items-start gap-3 border-b border-hairline px-5 py-3.5 last:border-b-0"
                >
                  <div
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-navy-900/5 text-navy-800"
                    aria-hidden="true"
                  >
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm leading-snug text-ink-900">
                      {notification.message}
                    </p>
                    <p className="mt-1 text-xs text-ink-400">
                      {formatRelativeTimestamp(notification.occurredAt)}
                    </p>
                  </div>
                  {!notification.read && (
                    <span
                      className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-maroon-600"
                      aria-hidden="true"
                    />
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}

export default RecentActivityPanel;