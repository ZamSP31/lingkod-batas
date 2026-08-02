import type { AppNotification } from "../types/notification.js";

/**
 * Placeholder data standing in for GET /api/notifications. Timestamps
 * are computed relative to "now" (rather than hardcoded ISO strings)
 * so formatRelativeTimestamp always has something recent to demo —
 * swap this for a real fetch/subscription once that endpoint exists.
 */
function minutesAgo(minutes: number): string {
  return new Date(Date.now() - minutes * 60_000).toISOString();
}

export const mockNotifications: AppNotification[] = [
  {
    id: "n-1",
    type: "contract-submitted",
    message:
      'Your contract "Cebu BPO Corp" was submitted successfully. Request #LB-2026-0142.',
    occurredAt: minutesAgo(2),
    read: false,
  },
  {
    id: "n-2",
    type: "analysis-complete",
    message: "AI analysis is complete and your contract is now awaiting attorney review.",
    occurredAt: minutesAgo(60),
    read: false,
  },
  {
    id: "n-3",
    type: "attorney-reviewing",
    message: "Atty. Dela Cruz has begun reviewing your freelance writing agreement.",
    occurredAt: "2026-07-12T09:00:00.000Z",
    read: true,
  },
  {
    id: "n-4",
    type: "report-ready",
    message: 'Your finalized report for "Retail associate contract" is now available.',
    occurredAt: "2026-07-04T09:00:00.000Z",
    read: true,
  },
];