/**
 * The authenticated client's profile, shown in the sidebar and on the
 * Account page. Mirrors AttorneyProfile's shape — this will eventually
 * come from the JWT-authenticated /api/users/me response rather than
 * the registration form.
 */
export interface ClientProfile {
  id: string;
  firstName: string;
  lastName: string;
  fullName: string;
  /** e.g. "Maria Reyes" — precomputed so display logic stays out of components. */
  displayName: string;
  /** Shown under the name in the sidebar, e.g. "Client". */
  role: string;
  email: string;
  /** Two-letter initials for the avatar, e.g. "MR". */
  contactNumber: string;
  /** Two-letter initials for the avatar, e.g. "MR". */
  initials: string;
}