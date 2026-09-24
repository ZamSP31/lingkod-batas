/**
 * notificationService.ts
 * Frontend API client for in-app notifications (/api/notifications).
 */

import type { AppNotification } from "../types/notification.js";

const BASE_URL = import.meta.env.VITE_API_URL ?? "http://localhost:5000";

export interface NotificationsResponse {
  unreadCount: number;
  notifications: AppNotification[];
}

/**
 * GET /api/notifications
 * Fetches notifications for the authenticated user.
 */
export async function getNotifications(
  token: string,
  options?: { limit?: number; unreadOnly?: boolean },
): Promise<NotificationsResponse> {
  const params = new URLSearchParams();
  if (options?.limit) params.set("limit", options.limit.toString());
  if (options?.unreadOnly) params.set("unreadOnly", "true");

  const query = params.toString() ? `?${params.toString()}` : "";
  const res = await fetch(`${BASE_URL}/api/notifications${query}`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });

  if (!res.ok) {
    const errorBody = await res.json().catch(() => ({}));
    throw new Error(errorBody.message ?? "Failed to fetch notifications.");
  }

  return res.json();
}

/**
 * PATCH /api/notifications/:id/read
 * Marks a single notification as read.
 */
export async function markNotificationAsRead(
  token: string,
  id: string,
): Promise<{ unreadCount: number; notification: AppNotification }> {
  const res = await fetch(`${BASE_URL}/api/notifications/${id}/read`, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });

  if (!res.ok) {
    const errorBody = await res.json().catch(() => ({}));
    throw new Error(
      errorBody.message ?? "Failed to mark notification as read.",
    );
  }

  return res.json();
}

/**
 * PATCH /api/notifications/read-all
 * Marks all notifications for the authenticated user as read.
 */
export async function markAllNotificationsAsRead(
  token: string,
): Promise<{ unreadCount: number; updatedCount: number }> {
  const res = await fetch(`${BASE_URL}/api/notifications/read-all`, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });

  if (!res.ok) {
    const errorBody = await res.json().catch(() => ({}));
    throw new Error(
      errorBody.message ?? "Failed to mark all notifications as read.",
    );
  }

  return res.json();
}

/**
 * DELETE /api/notifications/:id
 * Removes a notification from the list.
 */
export async function deleteNotification(
  token: string,
  id: string,
): Promise<{ unreadCount: number }> {
  const res = await fetch(`${BASE_URL}/api/notifications/${id}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });

  if (!res.ok) {
    const errorBody = await res.json().catch(() => ({}));
    throw new Error(errorBody.message ?? "Failed to delete notification.");
  }

  return res.json();
}
