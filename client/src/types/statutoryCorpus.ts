/**
 * A single legal source in the attorney's statutory corpus — the
 * documents the AI grounds its risk flags and citations against
 * (Fig. 3.27). `category` is intentionally a plain string rather than
 * a union: attorneys can add sources spanning legal domains the app
 * doesn't need to enumerate up front (Civil law, Labor law, IP law,
 * Privacy law, and whatever comes next).
 */
export interface StatutorySource {
  id: string;
  title: string;
  category: string;
  lastUpdatedAt: string; // ISO 8601 date string
  /** Link to the full text of the source, opened when a row is selected. */
  sourceUrl: string;
}
