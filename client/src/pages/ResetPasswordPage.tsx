import { useState } from "react";
import type { FormEvent } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import BrandMark from "../components/BrandMark.js";
import {
  validateNewPassword,
  validateConfirmPassword,
  PASSWORD_MAX_LENGTH,
} from "../utils/validation.js";
import { resetPassword } from "../services/authService.js";

interface ResetPasswordPageProps {
  onNavigateToLogin?: () => void;
  onNavigateToLanding?: () => void;
  onNavigateToForgotPassword?: () => void;
}

/**
 * Industry-standard Password Reset page matching Lingkod Batas design system.
 * Allows users to securely establish a new password using a verified one-time token.
 */
function ResetPasswordPage({
  onNavigateToLogin,
  onNavigateToLanding,
  onNavigateToForgotPassword,
}: ResetPasswordPageProps) {
  const navigate = useNavigate();
  const { token: paramToken } = useParams<{ token?: string }>();
  const [searchParams] = useSearchParams();
  const token = paramToken || searchParams.get("token") || "";

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [passwordError, setPasswordError] = useState<string | undefined>();
  const [confirmPasswordError, setConfirmPasswordError] = useState<
    string | undefined
  >();
  const [formError, setFormError] = useState<string | null>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  function handlePasswordChange(e: React.ChangeEvent<HTMLInputElement>) {
    const val = e.target.value;
    setPassword(val);
    if (passwordError) {
      setPasswordError(validateNewPassword(val));
    }
    if (confirmPassword && confirmPasswordError) {
      setConfirmPasswordError(validateConfirmPassword(val, confirmPassword));
    }
  }

  function handleConfirmPasswordChange(e: React.ChangeEvent<HTMLInputElement>) {
    const val = e.target.value;
    setConfirmPassword(val);
    if (confirmPasswordError) {
      setConfirmPasswordError(validateConfirmPassword(password, val));
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);

    const pErr = validateNewPassword(password);
    const cErr = validateConfirmPassword(password, confirmPassword);

    setPasswordError(pErr);
    setConfirmPasswordError(cErr);

    if (pErr || cErr) {
      return;
    }

    if (!token) {
      setFormError(
        "No recovery token was found in the link. Please request a new password reset link.",
      );
      return;
    }

    try {
      setIsSubmitting(true);
      await resetPassword(token, password);
      setIsSuccess(true);
    } catch (err: unknown) {
      const msg =
        err instanceof Error
          ? err.message
          : "Failed to reset password. Please try again or request a new link.";
      setFormError(msg);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="grid min-h-screen grid-cols-1 md:grid-cols-2 bg-parchment">
      {/* LEFT: Brand Panel */}
      <div className="relative hidden md:flex flex-col justify-between overflow-hidden bg-navy-deep p-12 lg:p-16 text-parchment">
        {/* Subtle radial ambient glow */}
        <div
          className="pointer-events-none absolute -left-20 -top-20 h-96 w-96 rounded-full bg-gold/10 blur-3xl"
          aria-hidden="true"
        />

        <div className="relative z-10">
          <BrandMark size="sm" layout="horizontal" theme="dark" />
        </div>

        <div className="relative z-10 max-w-[420px] my-auto py-12">
          <div className="inline-flex items-center gap-2 rounded-full border border-parchment/15 bg-white/5 px-3 py-1 text-[11px] font-medium text-gold mb-6">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
            Security &amp; Credential Protection
          </div>

          <h2 className="font-serif text-[32px] lg:text-[36px] font-medium leading-[1.2] text-parchment mb-4">
            Create your new secure password.
          </h2>
          <p className="text-sm leading-relaxed text-parchment/70">
            Choose a strong, unique password to safeguard your contracts, review history, and statutory data.
          </p>

          {/* Security Card Preview */}
          <div className="mt-8 rounded-2xl border border-white/10 bg-white/[0.04] p-5 shadow-2xl backdrop-blur-md">
            <div className="flex items-center justify-between pb-3 border-b border-white/10 text-[11px] font-mono text-parchment/60">
              <span>SECURITY PROTOCOL · RA 10173</span>
              <span className="rounded-full bg-emerald-500/20 text-emerald-300 px-2.5 py-0.5 text-[10px] font-sans font-semibold">
                Bcrypt Salted
              </span>
            </div>
            <p className="mt-3 text-xs text-parchment/80 leading-relaxed font-sans">
              &ldquo;Passwords are hashed with a one-way cryptographic salt before storage. Plaintext credentials are never saved or exposed across the platform.&rdquo;
            </p>
            <div className="mt-4 flex items-center justify-between pt-3 border-t border-white/10 text-[11px] text-parchment/50">
              <span className="flex items-center gap-1.5">
                <svg
                  className="w-3.5 h-3.5 text-gold"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                  />
                </svg>
                Zero-Knowledge Hashing
              </span>
              <span className="text-[10px] font-mono text-emerald-400">
                ACTIVE
              </span>
            </div>
          </div>
        </div>

        <div className="relative z-10 flex items-center justify-between text-xs text-parchment/50 pt-6 border-t border-white/10">
          <span>Lingkod Batas © 2026</span>
          <span>PD 442 · RA 10173 Grounded</span>
        </div>
      </div>

      {/* RIGHT: Form Side */}
      <div className="flex items-center justify-center p-6 sm:p-12 lg:p-16 bg-parchment">
        <div className="w-full max-w-[420px] rounded-2xl border border-line bg-white p-8 sm:p-10 shadow-sm">
          <a
            href="/"
            onClick={(e) => {
              e.preventDefault();
              if (onNavigateToLanding) {
                onNavigateToLanding();
              } else {
                navigate("/");
              }
            }}
            className="mb-6 inline-flex items-center gap-1.5 text-xs font-semibold text-ink-soft hover:text-ink transition-colors cursor-pointer group"
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              className="h-3.5 w-3.5 transition-transform group-hover:-translate-x-0.5"
            >
              <path d="M15 18L9 12L15 6" />
            </svg>
            Back to home
          </a>

          {isSuccess ? (
            <div className="text-center py-4">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 shadow-xs">
                <svg
                  className="h-7 w-7"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth="2.2"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>

              <h1 className="font-serif text-2xl font-bold tracking-tight text-navy-deep mb-2">
                Password updated
              </h1>
              <p className="text-xs text-ink-soft leading-relaxed mb-6">
                Your password has been securely reset. You can now use your new credentials to log into your Lingkod Batas dashboard.
              </p>

              <button
                type="button"
                onClick={() => {
                  if (onNavigateToLogin) {
                    onNavigateToLogin();
                  } else {
                    navigate("/login");
                  }
                }}
                className="w-full rounded-xl bg-maroon py-3 px-4 text-xs font-semibold uppercase tracking-wider text-parchment shadow-xs hover:bg-maroon-bright transition-all cursor-pointer"
              >
                Log in to your account →
              </button>
            </div>
          ) : !token ? (
            <div>
              <div className="mb-4 rounded-xl border border-amber-300 bg-amber-50 p-4 text-xs text-amber-900">
                <p className="font-semibold mb-1">Missing Reset Token</p>
                <p className="text-[11.5px] leading-relaxed text-amber-800">
                  No valid password reset token was found in your link. The link may be incomplete or expired.
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  if (onNavigateToForgotPassword) {
                    onNavigateToForgotPassword();
                  } else {
                    navigate("/forgot-password");
                  }
                }}
                className="w-full rounded-xl bg-maroon py-3 px-4 text-xs font-semibold uppercase tracking-wider text-parchment shadow-xs hover:bg-maroon-bright transition-all cursor-pointer"
              >
                Request a new reset link
              </button>
            </div>
          ) : (
            <>
              <div className="mb-6">
                <h1 className="font-serif text-2xl font-bold tracking-tight text-navy-deep mb-1.5">
                  Set new password
                </h1>
                <p className="text-xs text-ink-soft leading-relaxed">
                  Enter and confirm your new password below.
                </p>
              </div>

              <form noValidate onSubmit={handleSubmit}>
                {formError && (
                  <div
                    role="alert"
                    className="mb-4 rounded-xl border border-maroon/30 bg-maroon/5 px-3.5 py-2.5 text-xs text-maroon font-medium"
                  >
                    {formError}
                  </div>
                )}

                {/* New Password */}
                <div className="mb-4">
                  <label
                    htmlFor="new-password"
                    className="block text-xs font-semibold text-ink-soft mb-1.5"
                  >
                    New password
                  </label>
                  <div className="relative">
                    <input
                      id="new-password"
                      type={showPassword ? "text" : "password"}
                      name="password"
                      autoComplete="new-password"
                      placeholder="At least 8 characters"
                      maxLength={PASSWORD_MAX_LENGTH}
                      value={password}
                      onChange={handlePasswordChange}
                      className="w-full rounded-xl border border-line bg-white px-3.5 py-2.5 pr-10 text-sm text-ink placeholder:text-ink-soft/40 focus:border-navy-deep focus:outline-none focus:ring-2 focus:ring-navy-deep/10 transition-all shadow-2xs"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((prev) => !prev)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-ink-soft/50 hover:text-ink cursor-pointer focus:outline-none"
                      aria-label={
                        showPassword ? "Hide password" : "Show password"
                      }
                    >
                      {showPassword ? (
                        <svg
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="1.8"
                          className="h-4 w-4"
                        >
                          <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24" />
                          <line x1="1" y1="1" x2="23" y2="23" strokeWidth="1.8" />
                        </svg>
                      ) : (
                        <svg
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="1.8"
                          className="h-4 w-4"
                        >
                          <path d="M2 12S5 5 12 5S22 12 22 12S19 19 12 19S2 12 2 12Z" />
                          <circle cx="12" cy="12" r="3" />
                        </svg>
                      )}
                    </button>
                  </div>
                  {passwordError && (
                    <p className="mt-1.5 text-xs text-maroon font-medium">
                      {passwordError}
                    </p>
                  )}
                </div>

                {/* Confirm Password */}
                <div className="mb-6">
                  <label
                    htmlFor="confirm-password"
                    className="block text-xs font-semibold text-ink-soft mb-1.5"
                  >
                    Confirm new password
                  </label>
                  <div className="relative">
                    <input
                      id="confirm-password"
                      type={showConfirmPassword ? "text" : "password"}
                      name="confirmPassword"
                      autoComplete="new-password"
                      placeholder="Re-enter password"
                      maxLength={PASSWORD_MAX_LENGTH}
                      value={confirmPassword}
                      onChange={handleConfirmPasswordChange}
                      className="w-full rounded-xl border border-line bg-white px-3.5 py-2.5 pr-10 text-sm text-ink placeholder:text-ink-soft/40 focus:border-navy-deep focus:outline-none focus:ring-2 focus:ring-navy-deep/10 transition-all shadow-2xs"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword((prev) => !prev)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-ink-soft/50 hover:text-ink cursor-pointer focus:outline-none"
                      aria-label={
                        showConfirmPassword
                          ? "Hide confirm password"
                          : "Show confirm password"
                      }
                    >
                      {showConfirmPassword ? (
                        <svg
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="1.8"
                          className="h-4 w-4"
                        >
                          <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24" />
                          <line x1="1" y1="1" x2="23" y2="23" strokeWidth="1.8" />
                        </svg>
                      ) : (
                        <svg
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="1.8"
                          className="h-4 w-4"
                        >
                          <path d="M2 12S5 5 12 5S22 12 22 12S19 19 12 19S2 12 2 12Z" />
                          <circle cx="12" cy="12" r="3" />
                        </svg>
                      )}
                    </button>
                  </div>
                  {confirmPasswordError && (
                    <p className="mt-1.5 text-xs text-maroon font-medium">
                      {confirmPasswordError}
                    </p>
                  )}
                </div>

                {/* Password Hints */}
                <div className="mb-6 rounded-xl border border-line bg-parchment/40 p-3 text-[11px] text-ink-soft space-y-1 font-mono">
                  <p className="font-semibold text-navy-deep mb-1 font-sans">
                    Password requirements:
                  </p>
                  <p
                    className={
                      password.length >= 8 ? "text-emerald-700 font-bold" : ""
                    }
                  >
                    • Minimum 8 characters
                  </p>
                  <p
                    className={
                      /[A-Z]/.test(password) && /[a-z]/.test(password)
                        ? "text-emerald-700 font-bold"
                        : ""
                    }
                  >
                    • Uppercase &amp; lowercase letters
                  </p>
                  <p
                    className={
                      /[0-9]/.test(password) ? "text-emerald-700 font-bold" : ""
                    }
                  >
                    • At least one number
                  </p>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full rounded-xl bg-maroon py-3 px-4 text-xs font-semibold uppercase tracking-wider text-parchment shadow-xs hover:bg-maroon-bright active:scale-[0.99] transition-all disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <svg
                        className="animate-spin -ml-1 mr-2 h-4 w-4 text-parchment"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        />
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        />
                      </svg>
                      Updating password…
                    </>
                  ) : (
                    "Reset password"
                  )}
                </button>
              </form>

              {/* Back to Login */}
              <div className="mt-6 text-center text-xs text-ink-soft">
                Remembered your password?{" "}
                <a
                  href="#login"
                  onClick={(e) => {
                    e.preventDefault();
                    if (onNavigateToLogin) {
                      onNavigateToLogin();
                    } else {
                      navigate("/login");
                    }
                  }}
                  className="font-semibold text-maroon hover:text-maroon-bright transition-colors"
                >
                  Log in
                </a>
              </div>
            </>
          )}

          {/* Privacy Note */}
          <div className="mt-8 pt-6 border-t border-line flex items-center justify-center gap-2 text-[11px] text-ink-soft/60">
            <svg
              className="w-3.5 h-3.5 text-gold shrink-0"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
              />
            </svg>
            <span>Compliant with Data Privacy Act of 2012 (RA 10173)</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ResetPasswordPage;
