import { useState, useEffect } from "react";
import type { FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import BrandMark from "../components/BrandMark.js";
import {
  validateEmail,
  validateNewPassword,
  validateConfirmPassword,
  PASSWORD_MAX_LENGTH,
} from "../utils/validation.js";
import {
  sendResetOtp,
  verifyResetOtp,
  resetPassword,
} from "../services/authService.js";

interface ForgotPasswordPageProps {
  onNavigateToLogin?: () => void;
  onNavigateToLanding?: () => void;
}

type Step = "email" | "otp" | "password" | "success";

/**
 * Modern password recovery flow with email OTP verification.
 * Step 1: Input registered email -> Dispatches 6-digit OTP code.
 * Step 2: Input 6-digit OTP code -> Validates identity and exchanges for reset token.
 * Step 3: Input new password -> Updates encrypted password credentials in MongoDB.
 */
function ForgotPasswordPage({
  onNavigateToLogin,
  onNavigateToLanding,
}: ForgotPasswordPageProps) {
  const navigate = useNavigate();

  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [emailError, setEmailError] = useState<string | undefined>();
  const [otpError, setOtpError] = useState<string | undefined>();
  const [passwordError, setPasswordError] = useState<string | undefined>();
  const [confirmPasswordError, setConfirmPasswordError] = useState<
    string | undefined
  >();
  const [formError, setFormError] = useState<string | null>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [resetToken, setResetToken] = useState<string | null>(null);
  const [resendCooldown, setResendCooldown] = useState(0);

  // Timer for resend cooldown
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setInterval(() => {
      setResendCooldown((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [resendCooldown]);

  // STEP 1: Submit Email for OTP Dispatch
  async function handleEmailSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setFormError(null);

    const err = validateEmail(email);
    setEmailError(err);
    if (err) return;

    try {
      setIsSubmitting(true);
      await sendResetOtp(email);
      setResendCooldown(60);
      setStep("otp");
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : "Failed to dispatch verification code.";
      setFormError(msg);
    } finally {
      setIsSubmitting(false);
    }
  }

  // Resend OTP handler
  async function handleResendOtp() {
    if (resendCooldown > 0 || isSubmitting) return;
    setFormError(null);

    try {
      setIsSubmitting(true);
      await sendResetOtp(email);
      setResendCooldown(60);
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : "Failed to resend verification code.";
      setFormError(msg);
    } finally {
      setIsSubmitting(false);
    }
  }

  // STEP 2: Verify 6-digit OTP
  async function handleOtpSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setFormError(null);

    const cleanOtp = otp.trim();
    if (!cleanOtp) {
      setOtpError("Enter the 6-digit code.");
      return;
    }
    if (cleanOtp.length !== 6 || !/^\d{6}$/.test(cleanOtp)) {
      setOtpError("Verification code must be exactly 6 digits.");
      return;
    }
    setOtpError(undefined);

    try {
      setIsSubmitting(true);
      const res = await verifyResetOtp(email, cleanOtp);
      setResetToken(res.resetToken);
      setStep("password");
    } catch (err: unknown) {
      const msg =
        err instanceof Error
          ? err.message
          : "Invalid or expired verification code.";
      setFormError(msg);
    } finally {
      setIsSubmitting(false);
    }
  }

  // STEP 3: Submit New Password
  async function handlePasswordSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setFormError(null);

    const pErr = validateNewPassword(newPassword);
    const cErr = validateConfirmPassword(newPassword, confirmPassword);

    setPasswordError(pErr);
    setConfirmPasswordError(cErr);
    if (pErr || cErr) return;

    if (!resetToken) {
      setFormError("Verification session expired. Please request a new code.");
      setStep("email");
      return;
    }

    try {
      setIsSubmitting(true);
      await resetPassword(resetToken, newPassword);
      setStep("success");
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : "Failed to reset password.";
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
            Two-Step Identity Verification
          </div>

          <h2 className="font-serif text-[32px] lg:text-[36px] font-medium leading-[1.2] text-parchment mb-4">
            Authorized recovery for legal practitioners &amp; clients.
          </h2>
          <p className="text-sm leading-relaxed text-parchment/70">
            Recover your account using a time-limited 6-digit one-time authorization code sent directly to your registered email address.
          </p>

          {/* Interactive-style glassmorphic Security Card */}
          <div className="mt-8 rounded-2xl border border-white/10 bg-white/[0.04] p-5 shadow-2xl backdrop-blur-md">
            <div className="flex items-center justify-between pb-3 border-b border-white/10 text-[11px] font-mono text-parchment/60">
              <span>OTP AUTHENTICATION · RA 10173</span>
              <span className="rounded-full bg-emerald-500/20 text-emerald-300 px-2.5 py-0.5 text-[10px] font-sans font-semibold">
                Protected
              </span>
            </div>
            <p className="mt-3 text-xs text-parchment/80 leading-relaxed font-sans">
              &ldquo;Verification codes are cryptographically generated, SHA-256 hashed in memory, and set to auto-expire after 10 minutes to mitigate credential harvesting.&rdquo;
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
                    d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                  />
                </svg>
                Zero-Knowledge OTP
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
          {/* Back Link */}
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

          {/* Stepper Progress Bar */}
          {step !== "success" && (
            <div className="mb-6 flex items-center gap-2">
              <div
                className={`h-1.5 flex-1 rounded-full transition-colors ${
                  step === "email" || step === "otp" || step === "password"
                    ? "bg-maroon"
                    : "bg-line"
                }`}
              />
              <div
                className={`h-1.5 flex-1 rounded-full transition-colors ${
                  step === "otp" || step === "password" ? "bg-maroon" : "bg-line"
                }`}
              />
              <div
                className={`h-1.5 flex-1 rounded-full transition-colors ${
                  step === "password" ? "bg-maroon" : "bg-line"
                }`}
              />
            </div>
          )}

          {/* Error Banner */}
          {formError && (
            <div
              role="alert"
              className="mb-4 rounded-xl border border-maroon/30 bg-maroon/5 px-3.5 py-2.5 text-xs text-maroon font-medium"
            >
              {formError}
            </div>
          )}

          {/* STEP 1: Email Input */}
          {step === "email" && (
            <div>
              <div className="mb-6">
                <span className="font-mono text-[11px] font-semibold text-maroon uppercase tracking-wider block mb-1">
                  Step 1 of 3
                </span>
                <h1 className="font-serif text-2xl font-bold tracking-tight text-navy-deep mb-1.5">
                  Reset your password
                </h1>
                <p className="text-xs text-ink-soft leading-relaxed">
                  Enter your registered email address and we&rsquo;ll send you a 6-digit verification code.
                </p>
              </div>

              <form noValidate onSubmit={handleEmailSubmit}>
                <div className="mb-5">
                  <label
                    htmlFor="reset-email"
                    className="block text-xs font-semibold text-ink-soft mb-1.5"
                  >
                    Email address
                  </label>
                  <input
                    id="reset-email"
                    type="email"
                    name="email"
                    autoComplete="email"
                    placeholder="juandelacruz@email.com"
                    maxLength={50}
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (emailError) setEmailError(validateEmail(e.target.value));
                    }}
                    className="w-full rounded-xl border border-line bg-white px-3.5 py-2.5 text-sm text-ink placeholder:text-ink-soft/40 focus:border-navy-deep focus:outline-none focus:ring-2 focus:ring-navy-deep/10 transition-all shadow-2xs"
                  />
                  {emailError && (
                    <p className="mt-1.5 text-xs text-maroon font-medium">
                      {emailError}
                    </p>
                  )}
                </div>

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
                      Sending verification code…
                    </>
                  ) : (
                    "Send verification code →"
                  )}
                </button>
              </form>
            </div>
          )}

          {/* STEP 2: 6-Digit OTP Verification */}
          {step === "otp" && (
            <div>
              <div className="mb-6">
                <span className="font-mono text-[11px] font-semibold text-maroon uppercase tracking-wider block mb-1">
                  Step 2 of 3 · Verification
                </span>
                <h1 className="font-serif text-2xl font-bold tracking-tight text-navy-deep mb-1.5">
                  Enter 6-digit code
                </h1>
                <p className="text-xs text-ink-soft leading-relaxed">
                  We dispatched an authorization code to{" "}
                  <strong className="text-navy-deep">{email}</strong>.
                  <button
                    type="button"
                    onClick={() => {
                      setStep("email");
                      setOtp("");
                      setFormError(null);
                    }}
                    className="ml-1.5 text-maroon hover:underline font-medium cursor-pointer"
                  >
                    Change
                  </button>
                </p>
              </div>

              <form noValidate onSubmit={handleOtpSubmit}>
                <div className="mb-5">
                  <label
                    htmlFor="reset-otp"
                    className="block text-xs font-semibold text-ink-soft mb-1.5"
                  >
                    6-Digit Verification Code
                  </label>
                  <input
                    id="reset-otp"
                    type="text"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    placeholder="123456"
                    maxLength={6}
                    value={otp}
                    onChange={(e) => {
                      const val = e.target.value.replace(/\D/g, "");
                      setOtp(val);
                      if (otpError) setOtpError(undefined);
                    }}
                    className="w-full rounded-xl border border-line bg-white px-3.5 py-3 text-center font-mono text-2xl font-bold tracking-[0.35em] text-navy-deep placeholder:text-ink-soft/20 focus:border-navy-deep focus:outline-none focus:ring-2 focus:ring-navy-deep/10 transition-all shadow-2xs"
                  />
                  {otpError && (
                    <p className="mt-1.5 text-xs text-maroon font-medium text-center">
                      {otpError}
                    </p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting || otp.trim().length !== 6}
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
                      Verifying code…
                    </>
                  ) : (
                    "Verify Code →"
                  )}
                </button>
              </form>

              {/* Resend Code Action */}
              <div className="mt-5 text-center text-xs text-ink-soft">
                Didn&rsquo;t receive the code?{" "}
                {resendCooldown > 0 ? (
                  <span className="font-mono text-ink-soft/70">
                    Resend in {resendCooldown}s
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={handleResendOtp}
                    disabled={isSubmitting}
                    className="font-semibold text-maroon hover:text-maroon-bright cursor-pointer"
                  >
                    Resend code
                  </button>
                )}
              </div>
            </div>
          )}

          {/* STEP 3: Set New Password */}
          {step === "password" && (
            <div>
              <div className="mb-6">
                <span className="font-mono text-[11px] font-semibold text-emerald-700 uppercase tracking-wider block mb-1">
                  ✓ Verified · Step 3 of 3
                </span>
                <h1 className="font-serif text-2xl font-bold tracking-tight text-navy-deep mb-1.5">
                  Set new password
                </h1>
                <p className="text-xs text-ink-soft leading-relaxed">
                  Identity verified. Enter your new password for{" "}
                  <strong className="text-navy-deep">{email}</strong>.
                </p>
              </div>

              <form noValidate onSubmit={handlePasswordSubmit}>
                {/* New Password */}
                <div className="mb-4">
                  <label
                    htmlFor="new-pwd"
                    className="block text-xs font-semibold text-ink-soft mb-1.5"
                  >
                    New password
                  </label>
                  <div className="relative">
                    <input
                      id="new-pwd"
                      type={showPassword ? "text" : "password"}
                      name="newPassword"
                      autoComplete="new-password"
                      placeholder="At least 8 characters"
                      maxLength={PASSWORD_MAX_LENGTH}
                      value={newPassword}
                      onChange={(e) => {
                        setNewPassword(e.target.value);
                        if (passwordError)
                          setPasswordError(validateNewPassword(e.target.value));
                      }}
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
                    htmlFor="confirm-pwd"
                    className="block text-xs font-semibold text-ink-soft mb-1.5"
                  >
                    Confirm new password
                  </label>
                  <div className="relative">
                    <input
                      id="confirm-pwd"
                      type={showConfirmPassword ? "text" : "password"}
                      name="confirmPassword"
                      autoComplete="new-password"
                      placeholder="Re-enter new password"
                      maxLength={PASSWORD_MAX_LENGTH}
                      value={confirmPassword}
                      onChange={(e) => {
                        setConfirmPassword(e.target.value);
                        if (confirmPasswordError)
                          setConfirmPasswordError(
                            validateConfirmPassword(newPassword, e.target.value),
                          );
                      }}
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
                      newPassword.length >= 8 ? "text-emerald-700 font-bold" : ""
                    }
                  >
                    • Minimum 8 characters
                  </p>
                  <p
                    className={
                      /[A-Z]/.test(newPassword) && /[a-z]/.test(newPassword)
                        ? "text-emerald-700 font-bold"
                        : ""
                    }
                  >
                    • Uppercase &amp; lowercase letters
                  </p>
                  <p
                    className={
                      /[0-9]/.test(newPassword) ? "text-emerald-700 font-bold" : ""
                    }
                  >
                    • At least one number
                  </p>
                </div>

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
                    "Reset Password"
                  )}
                </button>
              </form>
            </div>
          )}

          {/* STEP 4: Success Screen */}
          {step === "success" && (
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
                Your password has been successfully reset. You can now use your new credentials to log into your dashboard.
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
          )}

          {/* Switch Row */}
          {step !== "success" && (
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

export default ForgotPasswordPage;
