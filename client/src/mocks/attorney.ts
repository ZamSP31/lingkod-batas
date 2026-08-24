import type { AttorneyDirectoryEntry, AttorneyProfile } from "../types/attorney.js";

/** Placeholder standing in for the authenticated GET /api/users/me response. */
export const mockCurrentAttorney: AttorneyProfile = {
  id: "atty-1",
  firstName: "Atty.",
  lastName: "Jimenez",
  fullName: "Atty. Jimenez",
  displayName: "Atty. Jimenez",
  rollNumber: "Roll No. 67890",
  email: "jimenez@lingkodbatas.ph",
  initials: "AJ",
};

export const mockAttorneyDirectory: AttorneyDirectoryEntry[] = [
  { id: "atty-1", displayName: "Atty. Jimenez", note: "managing counsel" },
];
