/**
 * notification.ts
 * In-app notification types for Lingkod Batas.
 */

export type NotificationType =
  | "contract-submitted"
  | "analysis-complete"
  | "attorney-reviewing"
  | "report-ready";

export interface AppNotification {
  id: string;
  type: NotificationType;
  title?: string;
  message: string;
  /** ISO 8601 timestamp. Rendered as relative time when recent, else a short date. */
  occurredAt: string;
  read: boolean;
  link?: string | null;
  contractId?: string | null;
}
