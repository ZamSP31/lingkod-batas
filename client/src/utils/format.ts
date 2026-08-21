/** Formats an ISO date string as "Jul 8, 2026", matching the dashboard mockups. */
export function formatShortDate(isoDate: string): string {
  const date = new Date(isoDate);
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

/** "2 high-risk" / "0 high-risk" / "1 high-risk" — kept singular/plural-agnostic since "risk" doesn't inflect. */
export function formatHighRiskCount(count: number): string {
  return `${count} high-risk`;
}
/** "1.4 MB" / "320 KB" — used in the upload dropzone's selected-file summary. */
export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  const kb = bytes / 1024;
  if (kb < 1024) return `${kb.toFixed(kb < 10 ? 1 : 0)} KB`;
  const mb = kb / 1024;
  return `${mb.toFixed(mb < 10 ? 1 : 0)} MB`;
}

/**
 * "2 minutes ago" for anything within the last 24h, otherwise falls
 * back to formatShortDate — matches the notifications panel mockup,
 * which shows relative time for same-day events and a plain date once
 * an item ages out of "today".
 */
export function formatRelativeTimestamp(isoDate: string): string {
  const date = new Date(isoDate);
  const diffMs = Date.now() - date.getTime();
  const diffMinutes = Math.round(diffMs / 60_000);

  if (diffMinutes < 1) return "Just now";
  if (diffMinutes < 60) {
    return `${diffMinutes} minute${diffMinutes === 1 ? "" : "s"} ago`;
  }

  const diffHours = Math.round(diffMinutes / 60);
  if (diffHours < 24) {
    return `${diffHours} hour${diffHours === 1 ? "" : "s"} ago`;
  }

  return formatShortDate(isoDate);
} 