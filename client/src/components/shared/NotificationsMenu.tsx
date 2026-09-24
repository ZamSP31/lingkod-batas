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

const TYPE_ICON: Record<NotificationType, typeof DocumentIcon> = {
  "contract-submitted": DocumentIcon,
  "analysis-complete": ActivityIcon,
  "attorney-reviewing": UserIcon,
  "report-ready": DownloadIcon,
};

const PANEL_WIDTH = 384;
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
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(false);

  const [panelStyle, setPanelStyle] = useState<PanelStyle>({
    top: 0,
    width: PANEL_WIDTH,
    maxHeight: 480,
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
    // Optimistic UI update
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
      // Optimistic update
      setNotifications((prev) =>
        prev.map((n) => (n.id === item.id ? { ...n, read: true } : n)),
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
      markNotificationAsRead(token, item.id).catch(() => {});
    }

    setIsOpen(false);

    if (item.link) {
      navigate(item.link);
    }
  }

  // Positioning calculations
  useLayoutEffect(() => {
    if (!isOpen) return;

    function updatePosition() {
      const trigger = triggerRef.current;
      if (!trigger) return;
      const rect = trigger.getBoundingClientRect();
      const top = rect.bottom + 8;
      const viewportWidth = window.innerWidth;
      const maxHeight = window.innerHeight - top - VIEWPORT_BOTTOM_GUTTER;

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

  return (
    <div ref={triggerRef} className="relative">
      <button
        type="button"
        onClick={() => setIsOpen((open) => !open)}
        aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ""}`}
        aria-expanded={isOpen}
        className="relative flex h-9 w-9 items-center justify-center rounded-full border border-line bg-white text-ink-soft transition-colors hover:bg-parchment/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-maroon/30 cursor-pointer"
      >
        <BellIcon className="h-4 w-4" />
        {unreadCount > 0 && (
          <span
            className="absolute -top-1 -right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-maroon px-1 text-[10px] font-bold text-white shadow-sm ring-2 ring-white"
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
            className="fixed z-50 flex flex-col overflow-hidden rounded-xl border border-hairline bg-white shadow-2xl animate-fade-in"
          >
            <div className="flex shrink-0 items-center justify-between gap-3 border-b border-hairline px-4 py-3 bg-parchment/30">
              <div className="flex items-center gap-2">
                <BellIcon className="h-4 w-4 text-navy-900" />
                <p className="text-sm font-semibold text-ink-900">
                  Notifications
                </p>
                {unreadCount > 0 && (
                  <span className="rounded-full bg-maroon/10 px-2 py-0.5 text-[11px] font-medium text-maroon">
                    {unreadCount} new
                  </span>
                )}
              </div>
              <button
                type="button"
                onClick={handleMarkAllRead}
                disabled={unreadCount === 0}
                className={`text-xs font-medium transition-colors ${
                  unreadCount === 0
                    ? "cursor-not-allowed text-ink-400"
                    : "text-maroon hover:text-maroon-700 cursor-pointer"
                }`}
              >
                Mark all read
              </button>
            </div>

            {isLoading && notifications.length === 0 ? (
              <div className="flex flex-col gap-3 p-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex animate-pulse items-start gap-3">
                    <div className="h-8 w-8 rounded-full bg-line/60" />
                    <div className="flex-1 space-y-2">
                      <div className="h-3 w-3/4 rounded bg-line/60" />
                      <div className="h-2 w-1/3 rounded bg-line/40" />
                    </div>
                  </div>
                ))}
              </div>
            ) : notifications.length === 0 ? (
              <div className="px-4 py-10 text-center">
                <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-parchment text-ink-soft mb-2">
                  <BellIcon className="h-5 w-5" />
                </div>
                <p className="text-sm font-medium text-ink-800">
                  You're all caught up
                </p>
                <p className="text-xs text-ink-soft mt-0.5">
                  No notifications yet.
                </p>
              </div>
            ) : (
              <ul className="min-h-0 flex-1 overflow-y-auto divide-y divide-hairline">
                {notifications.map((notification) => {
                  const Icon = TYPE_ICON[notification.type] || DocumentIcon;
                  return (
                    <li
                      key={notification.id}
                      onClick={() => handleNotificationClick(notification)}
                      className={`flex items-start gap-3 px-4 py-3 transition-colors cursor-pointer ${
                        notification.read
                          ? "bg-white hover:bg-parchment/30 opacity-75 hover:opacity-100"
                          : "bg-parchment/20 hover:bg-parchment/40"
                      }`}
                    >
                      <div
                        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
                          notification.read
                            ? "bg-navy-900/5 text-navy-800"
                            : "bg-maroon/10 text-maroon"
                        }`}
                        aria-hidden="true"
                      >
                        <Icon className="h-4 w-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        {notification.title && (
                          <p className="text-xs font-semibold text-ink-900 mb-0.5">
                            {notification.title}
                          </p>
                        )}
                        <p className="text-xs leading-snug text-ink-700 line-clamp-2">
                          {notification.message}
                        </p>
                        <p className="mt-1 text-[11px] text-ink-400">
                          {formatRelativeTimestamp(notification.occurredAt)}
                        </p>
                      </div>
                      {!notification.read && (
                        <span
                          className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-maroon"
                          aria-label="Unread notification"
                        />
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
          </div>,
          document.body,
        )}
    </div>
  );
}

export default NotificationsMenu;
