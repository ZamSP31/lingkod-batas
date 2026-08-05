import type { ClientProfile } from "../types/client.js";

/** Placeholder standing in for the authenticated GET /api/users/me response. */
export const mockCurrentClient: ClientProfile = {
  id: "client-1",
  firstName: "Maria",
  lastName: "Reyes",
  fullName: "Maria Reyes",
  displayName: "Maria Reyes",
  role: "Client",
  email: "maria.reyes@example.com",
  initials: "MR",
};