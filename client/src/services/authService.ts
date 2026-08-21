/**
 * authService.ts
 * All HTTP calls to /api/auth/*. Components never call fetch directly —
 * they go through this service, matching the project's services/ convention.
 *
 * Place this file at: client/src/services/authService.ts
 */

const BASE_URL = import.meta.env.VITE_API_URL ?? "http://localhost:5000";

export interface AuthUser {
  id: string;
  fullName: string;
  email: string;
  role: "client" | "attorney";
}

export interface AuthResponse {
  user: AuthUser;
  token: string;
}

/** Shape of the backend's centralized error response. */
interface ApiError {
  message: string;
}

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const body = (await res.json().catch(() => ({}))) as Partial<ApiError>;
    throw new Error(body.message ?? `Request failed (${res.status})`);
  }
  return res.json() as Promise<T>;
}

/**
 * POST /api/auth/register
 * Self-registration for Client accounts only.
 * Returns the new user profile + JWT token on success.
 *
 * Note: the backend expects `fullName`, not separate first/last fields.
 * The frontend RegisterPage splits name into firstName + lastName, so
 * this service merges them before sending.
 */
export async function registerClient(values: {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
}): Promise<AuthResponse> {
  const res = await fetch(`${BASE_URL}/api/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      fullName: `${values.firstName.trim()} ${values.lastName.trim()}`,
      email: values.email,
      password: values.password,
    }),
  });
  return handleResponse<AuthResponse>(res);
}

/**
 * POST /api/auth/login
 * Shared login for both Client and Attorney roles.
 * The backend determines the role from stored credentials and returns it
 * in the response — the frontend uses it to redirect to the correct dashboard.
 */
export async function loginUser(values: {
  email: string;
  password: string;
}): Promise<AuthResponse> {
  const res = await fetch(`${BASE_URL}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(values),
  });
  return handleResponse<AuthResponse>(res);
}
