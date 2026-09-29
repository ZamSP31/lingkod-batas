/**
 * authService.ts
 * All HTTP calls to /api/auth/*. Components never call fetch directly —
 * they go through this service, matching the project's services/ convention.
 *
 * Place this file at: client/src/services/authService.ts
 */

import { BASE_URL } from "./apiConfig.js";

export interface AuthUser {
  id: string;
  fullName: string;
  email: string;
  role: "client" | "attorney";
  contactNumber?: string;
  rollNumber?: string;
}

export interface AuthResponse {
  user: AuthUser;
  token: string;
}

export interface UpdateProfilePayload {
  firstName: string;
  lastName: string;
  email: string;
  contactNumber?: string | undefined;
  currentPassword?: string | undefined;
  newPassword?: string | undefined;
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
export async function sendRegisterOtp(values: {
  fullName: string;
  email: string;
}): Promise<SendOtpResponse> {
  const res = await fetch(`${BASE_URL}/api/auth/register-otp`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      fullName: values.fullName.trim(),
      email: values.email.trim(),
    }),
  });
  return handleResponse<SendOtpResponse>(res);
}

export async function registerClient(values: {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  otp: string;
}): Promise<AuthResponse> {
  const res = await fetch(`${BASE_URL}/api/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      fullName: `${values.firstName.trim()} ${values.lastName.trim()}`,
      email: values.email,
      password: values.password,
      otp: values.otp.trim(),
    }),
  });
  return handleResponse<AuthResponse>(res);
}

export interface LoginResponse {
  requires2FA: boolean;
  email: string;
  message: string;
  devOtp?: string;
}

/**
 * POST /api/auth/login
 * Shared login initiation for both Client and Attorney roles.
 * Dispatches a 6-digit 2FA code to the user's email.
 */
export async function loginUser(values: {
  email: string;
  password: string;
}): Promise<LoginResponse> {
  const res = await fetch(`${BASE_URL}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(values),
  });
  return handleResponse<LoginResponse>(res);
}

/**
 * POST /api/auth/login-verify-otp
 * Verifies the 6-digit 2FA code and returns the authenticated user + JWT token.
 */
export async function verifyLoginOtp(values: {
  email: string;
  otp: string;
}): Promise<AuthResponse> {
  const res = await fetch(`${BASE_URL}/api/auth/login-verify-otp`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(values),
  });
  return handleResponse<AuthResponse>(res);
}

/**
 * POST /api/auth/login-resend-otp
 * Dispatches a fresh 6-digit 2FA code.
 */
export async function resendLoginOtp(email: string): Promise<SendOtpResponse> {
  const res = await fetch(`${BASE_URL}/api/auth/login-resend-otp`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email }),
  });
  return handleResponse<SendOtpResponse>(res);
}

/**
 * PUT /api/auth/profile
 * Updates the user's name, email, contactNumber, and optionally password.
 */
export async function updateUserProfile(
  values: UpdateProfilePayload,
  token: string,
): Promise<AuthUser> {
  const res = await fetch(`${BASE_URL}/api/auth/profile`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      fullName: `${values.firstName.trim()} ${values.lastName.trim()}`.trim(),
      email: values.email,
      contactNumber: values.contactNumber,
      currentPassword: values.currentPassword,
      newPassword: values.newPassword,
    }),
  });
  const data = await handleResponse<{ user: AuthUser }>(res);
  return data.user;
}

export interface ForgotPasswordResponse {
  message: string;
  resetToken?: string;
  resetUrl?: string;
}

export interface ResetPasswordResponse {
  message: string;
}

/**
 * POST /api/auth/forgot-password
 * Requests a secure password reset link for the provided email address.
 */
export async function requestPasswordReset(
  email: string,
): Promise<ForgotPasswordResponse> {
  const res = await fetch(`${BASE_URL}/api/auth/forgot-password`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: email.trim() }),
  });
  return handleResponse<ForgotPasswordResponse>(res);
}

/**
 * POST /api/auth/reset-password
 * Resets the user's password using the cryptographic one-time token.
 */
export async function resetPassword(
  token: string,
  password: string,
): Promise<ResetPasswordResponse> {
  const res = await fetch(`${BASE_URL}/api/auth/reset-password`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ token, password }),
  });
  return handleResponse<ResetPasswordResponse>(res);
}

export interface SendOtpResponse {
  message: string;
  devOtp?: string;
}

export interface VerifyOtpResponse {
  message: string;
  resetToken: string;
}

/**
 * POST /api/auth/send-otp
 * Dispatches a 6-digit OTP verification code to the user's email.
 */
export async function sendResetOtp(email: string): Promise<SendOtpResponse> {
  const res = await fetch(`${BASE_URL}/api/auth/send-otp`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: email.trim() }),
  });
  return handleResponse<SendOtpResponse>(res);
}

/**
 * POST /api/auth/verify-otp
 * Verifies the 6-digit OTP and exchanges it for a single-use password reset token.
 */
export async function verifyResetOtp(
  email: string,
  otp: string,
): Promise<VerifyOtpResponse> {
  const res = await fetch(`${BASE_URL}/api/auth/verify-otp`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: email.trim(), otp: otp.trim() }),
  });
  return handleResponse<VerifyOtpResponse>(res);
}
