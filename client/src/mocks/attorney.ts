import type { AttorneyDirectoryEntry, AttorneyProfile } from "../types/attorney.js";

/** Placeholder standing in for the authenticated GET /api/users/me response. */
export const mockCurrentAttorney: AttorneyProfile = {
  id: "atty-1",
  firstName: "Juan",
  lastName: "Dela Cruz",
  fullName: "Juan Dela Cruz",
  displayName: "Atty. Juan Dela Cruz",
  rollNumber: "Roll No. 123456",
  email: "juan.delacruz@lawfirm.ph",
  initials: "JD",
};

export const mockAttorneyDirectory: AttorneyDirectoryEntry[] = [
  { id: "atty-1", displayName: "Atty. Dela Cruz", note: "last worked with you" },
  { id: "atty-2", displayName: "Atty. Santos" },
  { id: "atty-3", displayName: "Atty. Bautista" },
];
