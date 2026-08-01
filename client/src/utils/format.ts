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
