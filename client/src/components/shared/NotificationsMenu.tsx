import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import type {
  AppNotification,
  NotificationType,
} from "../../types/notification.js";
import { useAuth } from "../../context/AuthContext.js";
import {
  getNotifications,
  markAllNotificationsAsRead,
  markNotificationAsRead,
} from "../../services/notificationService.js";
import { formatRelativeTimestamp } from "../../utils/format.js";
import {
  BellIcon,
  DocumentIcon,
  ActivityIcon,
  UserIcon,
  DownloadIcon,
} from "./icons.js";

const TYPE_CONFIG: Record<
  NotificationType,
  {
    icon: typeof DocumentIcon;
    bg: string;
    text: string;
    ring: string;
  }
> = {
  "contract-submitted": {
    icon: DocumentIcon,
    bg: "bg-blue-50",
    text: "text-blue-700",
    ring: "ring-blue-600/15",
  },
  "analysis-complete": {
    icon: ActivityIcon,
    bg: "bg-indigo-50",
    text: "text-indigo-700",
    ring: "ring-indigo-600/15",
  },
  "attorney-reviewing": {
    icon: UserIcon,
    bg: "bg-amber-50",
    text: "text-amber-700",
    ring: "ring-amber-600/15",
  },
  "report-ready": {
    icon: DownloadIcon,
    bg: "bg-emerald-50",
    text: "text-emerald-700",
    ring: "ring-emerald-600/15",
  },
};

const PANEL_WIDTH = 400;
const COMPACT_BREAKPOINT = 768; // tailwind md
const COMPACT_GUTTER = 16;
const VIEWPORT_BOTTOM_GUTTER = 16;

interface PanelStyle {
  top: number;
  maxHeight: number;
  left?: number;
  right?: number;
  width?: number;
}

function NotificationsMenu() {
  const { token } = useAuth();
  const navigate = useNavigate();

  const [isOpen, setIsOpen] = useState(false);
  const [filter, setFilter] = useState<"all" | "unread">("all");
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(false);

  const [panelStyle, setPanelStyle] = useState<PanelStyle>({
    top: 0,
    width: PANEL_WIDTH,
    maxHeight: 520,
  });

  const triggerRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  // Fetch notifications from live backend
  const fetchLiveNotifications = useCallback(async () => {
    if (!token) return;
    try {
      const data = await getNotifications(token, { limit: 40 });
      setNotifications(data.notifications);
      setUnreadCount(data.unreadCount);
    } catch {
      // Graceful silence on background polling failure
    }
  }, [token]);

  // Initial load + periodic 20-second polling for real-time status updates
  useEffect(() => {
    if (!token) return;
    setIsLoading(true);
    fetchLiveNotifications().finally(() => setIsLoading(false));

    const pollInterval = window.setInterval(() => {
      fetchLiveNotifications();
    }, 20_000);

    return () => window.clearInterval(pollInterval);
  }, [token, fetchLiveNotifications]);

  // Refetch fresh data whenever the panel is opened
  useEffect(() => {
    if (isOpen && token) {
      fetchLiveNotifications();
    }
  }, [isOpen, token, fetchLiveNotifications]);

  async function handleMarkAllRead() {
    if (!token || unreadCount === 0) return;
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    setUnreadCount(0);
    try {
      await markAllNotificationsAsRead(token);
    } catch {
      fetchLiveNotifications();
    }
  }

  async function handleNotificationClick(item: AppNotification) {
    if (!item.read && token) {
      setNotifications((prev) =>
        prev.map((n) => (n.id === item.id ? { ...n, read: true } : n)),
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
      markNotificationAsRead(token, item.id).catch(() => {});
    }

    setIsOpen(false);

    if (item.link) {
      let target = item.link;

      // Normalize attorney review links
      const attorneyMatch = target.match(
        /\/attorney\/review(?:-queue)?(?:\?id=|\/)([a-zA-Z0-9]+)/,
      );
      if (attorneyMatch && attorneyMatch[1]) {
        target = `/attorney/review-queue/${attorneyMatch[1]}`;
      } else if (target.startsWith("/attorney/review")) {
        target = "/attorney/review-queue";
      }

      // Normalize client track status links
      const clientStatusMatch = target.match(
        /\/client\/(?:track-)?status(?:\?id=|\/)([a-zA-Z0-9]+)/,
      );
      if (clientStatusMatch && clientStatusMatch[1]) {
        target = `/client/track-status/${clientStatusMatch[1]}`;
      } else if (target.startsWith("/client/status")) {
        target = "/client/track-status";
      }

      // Normalize client contract report links
      const clientReportMatch = target.match(
        /\/client\/(?:contract-)?report(?:\?id=|\/)([a-zA-Z0-9]+)/,
      );
      if (clientReportMatch && clientReportMatch[1]) {
        target = `/client/contract-report/${clientReportMatch[1]}`;
      } else if (target.startsWith("/client/report")) {
        target = "/client/contract-report";
      }

      navigate(target);
    }
  }

  // Positioning calculations
  useLayoutEffect(() => {
    if (!isOpen) return;

    function updatePosition() {
      const trigger = triggerRef.current;
      if (!trigger) return;
      const rect = trigger.getBoundingClientRect();
      const top = rect.bottom + 10;
      const viewportWidth = window.innerWidth;
      const maxHeight = Math.min(
        540,
        window.innerHeight - top - VIEWPORT_BOTTOM_GUTTER,
      );

      if (viewportWidth < COMPACT_BREAKPOINT) {
        setPanelStyle({
          top,
          left: COMPACT_GUTTER,
          right: viewportWidth - rect.right,
          maxHeight,
        });
      } else {
        setPanelStyle({
          top,
          right: viewportWidth - rect.right,
          width: PANEL_WIDTH,
          maxHeight,
        });
      }
    }

    updatePosition();
    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition, true);
    return () => {
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition, true);
    };
  }, [isOpen]);

  // Click-outside and Escape dismiss handlers
  useEffect(() => {
    if (!isOpen) return;

    function handlePointerDown(event: MouseEvent) {
      const target = event.target as Node;
      if (
        !triggerRef.current?.contains(target) &&
        !panelRef.current?.contains(target)
      ) {
        setIsOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setIsOpen(false);
    }

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  const displayedNotifications =
    filter === "unread" ? notifications.filter((n) => !n.read) : notifications;

  return (
    <div ref={triggerRef} className="relative">
      <button
        type="button"
        onClick={() => setIsOpen((open) => !open)}
        aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ""}`}
        aria-expanded={isOpen}
        className={`relative flex h-9 w-9 items-center justify-center rounded-full border transition-all cursor-pointer ${
          isOpen
            ? "border-navy-deep bg-parchment text-navy-deep ring-2 ring-navy-deep/15"
            : "border-line bg-white text-ink-soft hover:border-navy-deep/30 hover:bg-parchment/50 hover:text-ink"
        }`}
      >
        <BellIcon className="h-4 w-4" />
        {unreadCount > 0 && (
          <span
            className="absolute -top-1 -right-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-maroon px-1 text-[10px] font-bold text-parchment shadow-xs ring-2 ring-white"
            aria-hidden="true"
          >
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {isOpen &&
        createPortal(
          <div
            ref={panelRef}
            role="menu"
            style={panelStyle}
            className="fixed z-50 flex flex-col overflow-hidden rounded-2xl border border-line bg-white shadow-2xl ring-1 ring-black/5 animate-fade-in"
          >
            {/* Top Bar */}
            <div className="flex shrink-0 items-center justify-between gap-3 border-b border-line px-4 pt-3.5 pb-3">
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold tracking-tight text-navy-deep">
                  Notifications
                </span>
                {unreadCount > 0 && (
                  <span className="rounded-full bg-maroon/10 px-2 py-0.5 text-[11px] font-semibold text-maroon">
                    {unreadCount} unread
                  </span>
                )}
              </div>
              <button
                type="button"
                onClick={handleMarkAllRead}
                disabled={unreadCount === 0}
                className={`flex items-center gap-1 text-xs font-medium transition-colors ${
                  unreadCount === 0
                    ? "cursor-not-allowed text-ink-soft/40"
                    : "text-maroon hover:text-maroon-bright cursor-pointer"
                }`}
              >
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="h-3.5 w-3.5"
                >
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                Mark all read
              </button>
            </div>

            {/* Segmented Filter Control */}
            <div className="flex shrink-0 items-center gap-1 border-b border-line bg-parchment/30 px-4 py-2">
              <button
                type="button"
                onClick={() => setFilter("all")}
                className={`rounded-lg px-2.5 py-1 text-xs font-medium transition-all cursor-pointer ${
                  filter === "all"
                    ? "bg-white text-navy-deep font-semibold shadow-2xs ring-1 ring-line"
                    : "text-ink-soft hover:text-ink"
                }`}
              >
                All ({notifications.length})
              </button>
              <button
                type="button"
                onClick={() => setFilter("unread")}
                className={`rounded-lg px-2.5 py-1 text-xs font-medium transition-all cursor-pointer ${
                  filter === "unread"
                    ? "bg-white text-navy-deep font-semibold shadow-2xs ring-1 ring-line"
                    : "text-ink-soft hover:text-ink"
                }`}
              >
                Unread ({unreadCount})
              </button>
            </div>

            {/* Content List */}
            {isLoading && notifications.length === 0 ? (
              <div className="flex flex-col gap-3 p-4">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="flex animate-pulse items-start gap-3.5"
                  >
                    <div className="h-9 w-9 rounded-full bg-parchment-dark/50" />
                    <div className="flex-1 space-y-2 pt-1">
                      <div className="h-3 w-3/4 rounded bg-parchment-dark/50" />
                      <div className="h-2.5 w-1/2 rounded bg-parchment" />
                    </div>
                  </div>
                ))}
              </div>
            ) : displayedNotifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center px-4 py-12 text-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-parchment text-ink-soft mb-3">
                  <BellIcon className="h-6 w-6 stroke-[1.5]" />
                </div>
                <p className="text-sm font-semibold text-navy-deep">
                  {filter === "unread"
                    ? "No unread notifications"
                    : "All caught up"}
                </p>
                <p className="text-xs text-ink-soft mt-1 max-w-[240px]">
                  {filter === "unread"
                    ? "You've read all contract pipeline updates."
                    : "Status notifications on your contracts will appear here."}
                </p>
              </div>
            ) : (
              <ul className="min-h-0 flex-1 overflow-y-auto divide-y divide-line">
                {displayedNotifications.map((notification) => {
                  const config =
                    TYPE_CONFIG[notification.type] ||
                    TYPE_CONFIG["contract-submitted"];
                  const Icon = config.icon;

                  return (
                    <li
                      key={notification.id}
                      onClick={() => handleNotificationClick(notification)}
                      className={`group flex items-start gap-3.5 px-4 py-3.5 transition-all cursor-pointer ${
                        notification.read
                          ? "bg-white hover:bg-parchment/30"
                          : "bg-parchment/25 hover:bg-parchment/50"
                      }`}
                    >
                      <div
                        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ring-1 ${config.bg} ${config.text} ${config.ring}`}
                        aria-hidden="true"
                      >
                        <Icon className="h-4.5 w-4.5 stroke-[1.8]" />
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-2">
                          <p
                            className={`text-[12.5px] leading-tight group-hover:text-maroon transition-colors ${
                              notification.read
                                ? "font-medium text-ink"
                                : "font-semibold text-navy-deep"
                            }`}
                          >
                            {notification.title || "Contract Update"}
                          </p>
                          {!notification.read && (
                            <span
                              className="mt-1 h-2 w-2 shrink-0 rounded-full bg-maroon ring-4 ring-maroon/15"
                              aria-label="Unread"
                            />
                          )}
                        </div>

                        <p className="mt-0.5 text-xs leading-snug text-ink-soft line-clamp-2">
                          {notification.message}
                        </p>

                        <div className="mt-1.5 flex items-center gap-1.5 text-[11px] font-medium text-ink-soft/60">
                          <svg
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="1.8"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            className="h-3 w-3"
                          >
                            <circle cx="12" cy="12" r="10" />
                            <polyline points="12 6 12 12 16 14" />
                          </svg>
                          <span>
                            {formatRelativeTimestamp(notification.occurredAt)}
                          </span>
                        </div>
                      </div>

                      <div className="shrink-0 self-center text-ink-soft/40 opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all">
                        <svg
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          className="h-4 w-4"
                        >
                          <polyline points="9 18 15 12 9 6" />
                        </svg>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}

            {/* Bottom Status Sync Bar */}
            <div className="flex shrink-0 items-center justify-between border-t border-line bg-parchment/30 px-4 py-2 text-[10.5px] text-ink-soft font-medium">
              <span className="flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Live pipeline sync
              </span>
              <span className="text-ink-soft/60">Click item to open</span>
            </div>
          </div>,
          document.body,
        )}
    </div>
  );
}

export default NotificationsMenu;
