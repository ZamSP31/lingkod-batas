/**
 * Notification events surfaced to both the client and admin roles. Kept
 * as a flat union (rather than splitting by role) since the panel UI is
 * shared — new event types (e.g. an admin-only "attorney-verified") can
 * be added here and given an icon/color in NotificationsMenu without
 * touching the panel component itself.
 */
export type NotificationType =
  | "contract-submitted"
  | "analysis-complete"
  | "attorney-reviewing"
  | "report-ready";

export interface AppNotification {
  id: string;
  type: NotificationType;
  message: string;
  /** ISO 8601 timestamp. Rendered as relative time when recent, else a short date. */
  occurredAt: string;
  read: boolean;
}