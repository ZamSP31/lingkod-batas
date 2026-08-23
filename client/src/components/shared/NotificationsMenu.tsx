import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import type { NotificationType } from "../../types/notification.js";
import { mockNotifications } from "../../mocks/notifications.js";
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

/**
 * Bell trigger + dropdown panel shown in both the client and admin
 * topbars. Frontend-only for now: it seeds itself from mockNotifications
 * and owns read/unread state internally (useState), since there's no
 * notifications API yet. Drop <NotificationsMenu /> into a topbar with
 * no props needed. Once GET/PATCH /api/notifications exist, swap the
 * initial useState value for a fetch and point handleMarkAllRead at a
 * real request instead of local state.
 */
// Above COMPACT_BREAKPOINT there's room for the panel to sit under the
// bell without touching the sidebar (AttorneySidebar, a fixed w-64 /
// 256px), so it behaves like a normal right-anchored dropdown with a
// fixed width. Below it, we pin BOTH edges instead — left to the true
// viewport edge (so it overlaps the sidebar) and right to the bell (so
// it still reads as "belonging" to the trigger instead of floating with
// dead space) — and let the browser stretch the width between them.
// That auto-stretch is what keeps it glued to the right at every size
// from a phone up to COMPACT_BREAKPOINT, with no width math needed.
const PANEL_WIDTH = 384; // matches the old w-96, used above COMPACT_BREAKPOINT
const COMPACT_BREAKPOINT = 768; // tailwind's `md`
const COMPACT_GUTTER = 16;

interface PanelStyle {
  top: number;
  maxHeight: number;
  left?: number;
  right?: number;
  width?: number;
}

const VIEWPORT_BOTTOM_GUTTER = 16;

function NotificationsMenu() {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState(mockNotifications);
  const [panelStyle, setPanelStyle] = useState<PanelStyle>({
    top: 0,
    width: PANEL_WIDTH,
    maxHeight: 480,
  });
  const triggerRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const unreadCount = notifications.filter((n) => !n.read).length;

  function handleMarkAllRead() {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  }

  // Recompute the panel's position (in viewport coordinates) every time
  // it opens, and keep it glued to the bell on scroll/resize. Using
  // fixed + a portal means the panel is painted outside <main>, so its
  // overflow-y-auto can no longer clip the overlap into the sidebar.
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
            className="absolute right-[9px] top-[8px] h-1.5 w-1.5 rounded-full bg-maroon"
            aria-hidden="true"
          />
        )}
      </button>

      {isOpen &&
        createPortal(
          <div
            ref={panelRef}
            role="menu"
            style={panelStyle}
            className="fixed z-50 flex flex-col overflow-hidden rounded-xl border border-hairline bg-white shadow-2xl"
          >
            <div className="flex shrink-0 items-center justify-between gap-3 border-b border-hairline px-4 py-3">
              <div className="flex items-center gap-2">
                <BellIcon className="h-4 w-4 text-navy-900" />
                <p className="text-sm font-semibold text-ink-900">
                  Notifications
                </p>
              </div>
              <button
                type="button"
                onClick={handleMarkAllRead}
                disabled={unreadCount === 0}
                className={`text-xs font-medium transition-colors ${
                  unreadCount === 0
                    ? "cursor-not-allowed text-ink-400"
                    : "text-maroon-600 hover:text-maroon-700"
                }`}
              >
                Mark all read
              </button>
            </div>

            {notifications.length === 0 ? (
              <p className="px-4 py-10 text-center text-sm text-ink-600">
                You're all caught up — no notifications yet.
              </p>
            ) : (
              <ul className="min-h-0 flex-1 overflow-y-auto">
                {notifications.map((notification) => {
                  const Icon = TYPE_ICON[notification.type];
                  return (
                    <li
                      key={notification.id}
                      className="flex items-start gap-3 border-b border-hairline px-4 py-3 last:border-b-0"
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
          </div>,
          document.body,
        )}
    </div>
  );
}

export default NotificationsMenu;
