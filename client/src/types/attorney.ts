/**
 * The authenticated attorney's profile, shown in the sidebar and on the
 * Account page. Attorney accounts are administrator-created (per the
 * Register functional requirement) rather than self-registered, so this
 * will eventually come from the JWT-authenticated /api/users/me
 * response rather than a registration form.
 */
export interface AttorneyProfile {
  id: string;
  firstName: string;
  lastName: string;
  fullName: string;
  /** e.g. "Atty. Juan Dela Cruz" — precomputed so display logic stays out of components. */
  displayName: string;
  /** IBP Roll of Attorneys number, shown under the name in the sidebar. */
  rollNumber: string;
  email: string;
  /** Two-letter initials for the avatar, e.g. "JD". */
  initials: string;
}
