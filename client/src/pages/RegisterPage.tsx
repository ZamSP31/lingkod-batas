import { useState, useEffect } from "react";
import type { FormEvent } from "react";
import BrandMark from "../components/BrandMark.js";
import TermsModal from "../components/TermsModal.js";
import { useAuth } from "../context/AuthContext.js";
import {
  validateRegisterForm,
  validateName,
  validateEmail,
  validateNewPassword,
  validateConfirmPassword,
  hasValidationErrors,
} from "../utils/validation.js";
import { sendRegisterOtp } from "../services/authService.js";
import type { RegisterFormErrors, RegisterFormValues } from "../types/auth.js";

const INITIAL_VALUES: RegisterFormValues = {
  firstName: "",
  lastName: "",
  email: "",
  password: "",
  confirmPassword: "",
};

interface RegisterPageProps {
  onNavigateToLogin?: () => void;
  onNavigateToLanding?: () => void;
}

/**
 * Client registration screen matching Lingkod Batas Screen 2 (Register) mockup.
 * Features a split 2-column layout with deep navy brand panel and ghost clause motif.
 * Enforces email ownership via 6-digit OTP verification before account activation.
 */
function RegisterPage({
  onNavigateToLogin,
  onNavigateToLanding,
}: RegisterPageProps) {
  const { register } = useAuth();
  const [step, setStep] = useState<"form" | "otp">("form");
  const [values, setValues] = useState<RegisterFormValues>(INITIAL_VALUES);
  const [errors, setErrors] = useState<RegisterFormErrors>({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [accountCreated, setAccountCreated] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [termsError, setTermsError] = useState<string | undefined>(undefined);
  const [isTermsModalOpen, setIsTermsModalOpen] = useState(false);

  // OTP Verification States
  const [otp, setOtp] = useState("");
  const [otpError, setOtpError] = useState<string | undefined>(undefined);
  const [resendCooldown, setResendCooldown] = useState(0);

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setInterval(() => {
      setResendCooldown((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [resendCooldown]);

  function handleChange(field: keyof RegisterFormValues) {
    return (event: React.ChangeEvent<HTMLInputElement>) => {
      const newValue = event.target.value;
      const nextValues = { ...values, [field]: newValue };
      setValues(nextValues);

      function liveErrorFor(f: keyof RegisterFormValues): string | undefined {
        const v = nextValues[f];
        if (v.trim() === "") return undefined;

        switch (f) {
          case "firstName":
            return validateName(v, "First name");
          case "lastName":
            return validateName(v, "Last name");
          case "email":
            return validateEmail(v);
          case "password":
            return validateNewPassword(v);
          case "confirmPassword":
            return validateConfirmPassword(nextValues.password, v);
        }
      }

      setErrors((prev) => ({
        ...prev,
        [field]: liveErrorFor(field),
        ...(field === "password"
          ? { confirmPassword: liveErrorFor("confirmPassword") }
          : {}),
        form: undefined,
      }));
    };
  }

  function handleTermsChange(event: React.ChangeEvent<HTMLInputElement>) {
    const checked = event.target.checked;
    setAgreedToTerms(checked);
    setTermsError(checked ? undefined : termsError);
  }

  async function handleSubmitForm(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const validationErrors = validateRegisterForm(values);
    const hasFieldErrors = hasValidationErrors(validationErrors);
    const missingTermsAgreement = !agreedToTerms;

    if (hasFieldErrors || missingTermsAgreement) {
      setErrors(validationErrors);
      setTermsError(
        missingTermsAgreement
          ? "You must agree to the Terms and Conditions to continue."
          : undefined,
      );
      return;
    }

    setIsSubmitting(true);
    setErrors({});
    setTermsError(undefined);

    try {
      await sendRegisterOtp({
        fullName: `${values.firstName} ${values.lastName}`.trim(),
        email: values.email,
      });
      setResendCooldown(60);
      setStep("otp");
    } catch (err: unknown) {
      const errorMessage =
        err instanceof Error
          ? err.message
          : "Failed to dispatch verification code.";
      setErrors({ form: errorMessage });
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleResendOtp() {
    if (resendCooldown > 0 || isSubmitting) return;
    setErrors({});
    setOtpError(undefined);

    try {
      setIsSubmitting(true);
      await sendRegisterOtp({
        fullName: `${values.firstName} ${values.lastName}`.trim(),
        email: values.email,
      });
      setResendCooldown(60);
    } catch (err: unknown) {
      const msg =
        err instanceof Error
          ? err.message
          : "Failed to resend verification code.";
      setErrors({ form: msg });
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleOtpSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErrors({});

    const cleanOtp = otp.trim();
    if (!cleanOtp) {
      setOtpError("Enter the 6-digit code.");
      return;
    }
    if (cleanOtp.length !== 6 || !/^\d{6}$/.test(cleanOtp)) {
      setOtpError("Verification code must be exactly 6 digits.");
      return;
    }

    try {
      setIsSubmitting(true);
      await register({
        firstName: values.firstName,
        lastName: values.lastName,
        email: values.email,
        password: values.password,
        otp: cleanOtp,
      });
      setAccountCreated(true);
    } catch (err: unknown) {
      const msg =
        err instanceof Error
          ? err.message
          : "Failed to verify registration code.";
      setErrors({ form: msg });
    } finally {
      setIsSubmitting(false);
    }
  }

  if (accountCreated) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-parchment px-4">
        <div className="w-full max-w-sm rounded-lg border border-line bg-white p-8 text-center shadow-xs">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-navy/10">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              className="h-6 w-6 text-navy"
              aria-hidden="true"
            >
              <path
                d="M5 12.5l4.5 4.5L19 7"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
          <h2 className="font-serif text-xl font-medium text-navy-deep">
            Account created
          </h2>
          <p className="mt-2 text-sm text-ink-soft">
            Your client account is ready.
          </p>
          <button
            type="button"
            onClick={() => {
              setAccountCreated(false);
              setValues(INITIAL_VALUES);
              setAgreedToTerms(false);
              onNavigateToLogin?.();
            }}
            className="mt-6 font-mono text-xs font-semibold text-maroon hover:text-maroon-bright cursor-pointer"
          >
            ← Proceed to sign in
          </button>
        </div>
      </main>
    );
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

        <div className="relative z-10 max-w-[420px] my-auto py-10">
          <div className="inline-flex items-center gap-2 rounded-full border border-parchment/15 bg-white/5 px-3 py-1 text-[11px] font-medium text-gold mb-6">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
            Client Account Registration
          </div>

          <h2 className="font-serif text-[32px] lg:text-[36px] font-medium leading-[1.2] text-parchment mb-4">
            Upload once. Let verified counsel do the reading.
          </h2>
          <p className="text-sm leading-relaxed text-parchment/70">
            Client accounts are free. Every employment contract undergoes preliminary Labor Code screening and strict attorney gatekeeping before report release.
          </p>

          {/* Interactive-style glassmorphic Audit Card Preview */}
          <div className="mt-8 rounded-2xl border border-white/10 bg-white/[0.04] p-5 shadow-2xl backdrop-blur-md">
            <div className="flex items-center justify-between pb-3 border-b border-white/10 text-[11px] font-mono text-parchment/60">
              <span>ART. 113 · WAGE DEDUCTIONS</span>
              <span className="rounded-full bg-emerald-500/20 text-emerald-300 px-2.5 py-0.5 text-[10px] font-sans font-semibold">
                Protected
              </span>
            </div>
            <p className="mt-3 text-xs leading-relaxed text-parchment/90 italic">
              "No deductions from employee wages shall be made except for statutory insurance, tax, and written union dues..."
            </p>
            <div className="mt-3.5 flex items-center justify-between text-[11px] text-parchment/60 pt-3 border-t border-white/5">
              <span className="flex items-center gap-1.5 text-gold">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  className="h-3.5 w-3.5"
                >
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                </svg>
                Attorney Verified
              </span>
              <span>RA 10173 PII Redacted</span>
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
        <div className="w-full max-w-[440px] rounded-2xl border border-line bg-white p-8 sm:p-10 shadow-sm">
          <a
            href="/"
            onClick={(e) => {
              e.preventDefault();
              onNavigateToLanding?.();
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

          {step === "form" ? (
            <>
              <div className="mb-6">
                <h1 className="font-serif text-2xl font-bold tracking-tight text-navy-deep mb-1.5">
                  Create your account
                </h1>
                <p className="text-xs text-ink-soft leading-relaxed">
                  For clients seeking attorney-supervised employment contract reviews.
                </p>
              </div>

              <form noValidate onSubmit={handleSubmitForm}>
            {errors.form && (
              <div
                role="alert"
                className="mb-4 rounded-xl border border-maroon/30 bg-maroon/5 px-3.5 py-2.5 text-xs text-maroon font-medium"
              >
                {errors.form}
              </div>
            )}

            {/* Name Row */}
            <div className="mb-4 grid grid-cols-2 gap-3.5">
              <div>
                <label
                  htmlFor="firstName"
                  className="block text-xs font-semibold text-ink-soft mb-1.5"
                >
                  First name
                </label>
                <input
                  id="firstName"
                  type="text"
                  name="firstName"
                  autoComplete="given-name"
                  placeholder="Juan"
                  maxLength={50}
                  value={values.firstName}
                  onChange={handleChange("firstName")}
                  className="w-full rounded-xl border border-line bg-white px-3.5 py-2.5 text-sm text-ink placeholder:text-ink-soft/40 focus:border-navy-deep focus:outline-none focus:ring-2 focus:ring-navy-deep/10 transition-all shadow-2xs"
                />
                {errors.firstName && (
                  <p className="mt-1 text-xs text-maroon font-medium">
                    {errors.firstName}
                  </p>
                )}
              </div>
              <div>
                <label
                  htmlFor="lastName"
                  className="block text-xs font-semibold text-ink-soft mb-1.5"
                >
                  Last name
                </label>
                <input
                  id="lastName"
                  type="text"
                  name="lastName"
                  autoComplete="family-name"
                  placeholder="Dela Cruz"
                  maxLength={50}
                  value={values.lastName}
                  onChange={handleChange("lastName")}
                  className="w-full rounded-xl border border-line bg-white px-3.5 py-2.5 text-sm text-ink placeholder:text-ink-soft/40 focus:border-navy-deep focus:outline-none focus:ring-2 focus:ring-navy-deep/10 transition-all shadow-2xs"
                />
                {errors.lastName && (
                  <p className="mt-1 text-xs text-maroon font-medium">
                    {errors.lastName}
                  </p>
                )}
              </div>
            </div>

            {/* Email Field */}
            <div className="mb-4">
              <label
                htmlFor="email"
                className="block text-xs font-semibold text-ink-soft mb-1.5"
              >
                Email address
              </label>
              <input
                id="email"
                type="email"
                name="email"
                autoComplete="email"
                placeholder="juandelacruz@email.com"
                maxLength={50}
                value={values.email}
                onChange={handleChange("email")}
                className="w-full rounded-xl border border-line bg-white px-3.5 py-2.5 text-sm text-ink placeholder:text-ink-soft/40 focus:border-navy-deep focus:outline-none focus:ring-2 focus:ring-navy-deep/10 transition-all shadow-2xs"
              />
              {errors.email && (
                <p className="mt-1.5 text-xs text-maroon font-medium">{errors.email}</p>
              )}
            </div>

            {/* Password Field */}
            <div className="mb-4">
              <label
                htmlFor="password"
                className="block text-xs font-semibold text-ink-soft mb-1.5"
              >
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  name="password"
                  autoComplete="new-password"
                  placeholder="At least 8 characters"
                  maxLength={50}
                  value={values.password}
                  onChange={handleChange("password")}
                  className="w-full rounded-xl border border-line bg-white px-3.5 py-2.5 pr-10 text-sm text-ink placeholder:text-ink-soft/40 focus:border-navy-deep focus:outline-none focus:ring-2 focus:ring-navy-deep/10 transition-all shadow-2xs"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-ink-soft/50 hover:text-ink cursor-pointer focus:outline-none"
                  aria-label={showPassword ? "Hide password" : "Show password"}
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
              <p className="mt-1 text-[11px] text-ink-soft/60 font-medium">
                Include uppercase, lowercase, and a number.
              </p>
              {errors.password && (
                <p className="mt-1 text-xs text-maroon font-medium">{errors.password}</p>
              )}
            </div>

            {/* Confirm Password Field */}
            <div className="mb-4.5">
              <label
                htmlFor="confirmPassword"
                className="block text-xs font-semibold text-ink-soft mb-1.5"
              >
                Confirm password
              </label>
              <div className="relative">
                <input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  name="confirmPassword"
                  autoComplete="new-password"
                  placeholder="Re-enter your password"
                  maxLength={50}
                  value={values.confirmPassword}
                  onChange={handleChange("confirmPassword")}
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
              {errors.confirmPassword && (
                <p className="mt-1 text-xs text-maroon font-medium">
                  {errors.confirmPassword}
                </p>
              )}
            </div>

            {/* Terms & Conditions Consent */}
            <div className="mb-5 rounded-xl border border-line bg-parchment/40 p-3.5">
              <label
                htmlFor="agreedToTerms"
                className="flex cursor-pointer items-start gap-2.5"
              >
                <input
                  id="agreedToTerms"
                  type="checkbox"
                  name="agreedToTerms"
                  checked={agreedToTerms}
                  onChange={handleTermsChange}
                  className="mt-0.5 h-4 w-4 shrink-0 rounded border-line text-maroon focus:ring-maroon cursor-pointer accent-maroon"
                  aria-describedby="terms-disclaimer"
                />
                <span className="text-xs leading-relaxed text-ink-soft">
                  I agree to the Lingkod Batas{" "}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      e.preventDefault();
                      setIsTermsModalOpen(true);
                    }}
                    className="font-semibold text-maroon hover:text-maroon-bright hover:underline underline-offset-2 cursor-pointer"
                  >
                    Terms of Service &amp; Privacy Notice
                  </button>{" "}
                  and consent to secure third-party processing under RA 10173.
                </span>
              </label>
              {termsError && (
                <p className="mt-2 text-xs text-maroon font-medium">{termsError}</p>
              )}

              <p
                id="terms-disclaimer"
                className="mt-2 text-[10.5px] leading-relaxed text-ink-soft/70"
              >
                In compliance with the Data Privacy Act (RA 10173), uploaded contracts undergo automated PII redaction before analysis. Client contract text is processed under zero-training API agreements and certified by a supervising attorney.
              </p>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full rounded-xl bg-maroon py-3 px-4 text-xs font-semibold uppercase tracking-wider text-parchment shadow-xs transition-all hover:bg-maroon-bright active:scale-[0.99] disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <svg
                    className="h-4 w-4 animate-spin text-parchment"
                    viewBox="0 0 24 24"
                    fill="none"
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
                  <span>Sending verification code…</span>
                </>
              ) : (
                <span>Continue to verification →</span>
              )}
            </button>
          </form>

          {/* Switch Row */}
          <div className="mt-6 text-center text-xs text-ink-soft">
            Already have an account?{" "}
            <a
              href="#login"
              onClick={(e) => {
                e.preventDefault();
                onNavigateToLogin?.();
              }}
              className="font-semibold text-maroon hover:text-maroon-bright transition-colors"
            >
              Sign in
            </a>
          </div>
        </>
      ) : (
        <div>
          <div className="mb-6">
            <span className="font-mono text-[11px] font-semibold text-maroon uppercase tracking-wider block mb-1">
              Step 2 of 2 · Verification
            </span>
            <h1 className="font-serif text-2xl font-bold tracking-tight text-navy-deep mb-1.5">
              Enter 6-digit code
            </h1>
            <p className="text-xs text-ink-soft leading-relaxed">
              We dispatched a verification code to{" "}
              <strong className="text-navy-deep">{values.email}</strong>.
              <button
                type="button"
                onClick={() => {
                  setStep("form");
                  setOtp("");
                  setOtpError(undefined);
                  setErrors({});
                }}
                className="ml-1.5 text-maroon hover:underline font-medium cursor-pointer"
              >
                Change
              </button>
            </p>
          </div>

          {errors.form && (
            <div
              role="alert"
              className="mb-4 rounded-xl border border-maroon/30 bg-maroon/5 px-3.5 py-2.5 text-xs text-maroon font-medium"
            >
              {errors.form}
            </div>
          )}

          <form noValidate onSubmit={handleOtpSubmit}>
            <div className="mb-5">
              <label
                htmlFor="register-otp"
                className="block text-xs font-semibold text-ink-soft mb-1.5"
              >
                6-Digit Verification Code
              </label>
              <input
                id="register-otp"
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
                  Creating account…
                </>
              ) : (
                "Verify & Complete Registration →"
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

          <div className="mt-6 pt-4 border-t border-line text-center">
            <button
              type="button"
              onClick={() => {
                setStep("form");
                setOtp("");
                setOtpError(undefined);
                setErrors({});
              }}
              className="text-xs font-semibold text-ink-soft hover:text-ink cursor-pointer"
            >
              ← Edit registration details
            </button>
          </div>
        </div>
      )}
        </div>
      </div>

      <TermsModal
        open={isTermsModalOpen}
        onClose={() => setIsTermsModalOpen(false)}
      />
    </div>
  );
}

export default RegisterPage;
