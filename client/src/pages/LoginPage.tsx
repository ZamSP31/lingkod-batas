import { useState, useEffect } from "react";
import type { FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import BrandMark from "../components/BrandMark.js";
import { useAuth } from "../context/AuthContext.js";
import {
  validateLoginForm,
  validateEmail,
  validateLoginPassword,
  hasValidationErrors,
} from "../utils/validation.js";
import type { LoginFormErrors, LoginFormValues } from "../types/auth.js";

const INITIAL_VALUES: LoginFormValues = { email: "", password: "" };

interface LoginPageProps {
  onNavigateToRegister?: () => void;
  onNavigateToForgotPassword?: () => void;
  onNavigateToLanding?: () => void;
}

/**
 * Sign-in screen matching Lingkod Batas Screen 1 (Login) mockup.
 * Features a split 2-column layout with deep navy brand panel and ghost clause motif.
 * Enforces email-based 6-digit Two-Factor Authentication (2FA) for secure access.
 */
function LoginPage({
  onNavigateToRegister,
  onNavigateToForgotPassword,
  onNavigateToLanding,
}: LoginPageProps) {
  const navigate = useNavigate();
  const { login, verifyLogin2FA, resendLogin2FA } = useAuth();
  const [step, setStep] = useState<"credentials" | "2fa">("credentials");
  const [values, setValues] = useState<LoginFormValues>(INITIAL_VALUES);
  const [errors, setErrors] = useState<LoginFormErrors>({});
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 2FA states
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

  function handleChange(field: keyof LoginFormValues) {
    return (event: React.ChangeEvent<HTMLInputElement>) => {
      const newValue = event.target.value;
      setValues((prev) => ({ ...prev, [field]: newValue }));

      const liveError =
        newValue.trim() === ""
          ? undefined
          : field === "email"
            ? validateEmail(newValue)
            : validateLoginPassword(newValue);

      setErrors((prev) => ({ ...prev, [field]: liveError, form: undefined }));
    };
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const validationErrors = validateLoginForm(values);
    if (hasValidationErrors(validationErrors)) {
      setErrors(validationErrors);
      return;
    }

    setIsSubmitting(true);
    setErrors({});

    try {
      const res = await login({
        email: values.email,
        password: values.password,
      });

      if (res.requires2FA) {
        setResendCooldown(60);
        setStep("2fa");
      }
    } catch (err: unknown) {
      const errorMessage =
        err instanceof Error ? err.message : "Invalid email or password.";
      setErrors({ form: errorMessage });
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleVerify2FA(e: FormEvent<HTMLFormElement>) {
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
      const user = await verifyLogin2FA({
        email: values.email,
        otp: cleanOtp,
      });

      // Role-based redirection
      if (user.role === "attorney") {
        navigate("/attorney");
      } else {
        navigate("/client");
      }
    } catch (err: unknown) {
      const msg =
        err instanceof Error
          ? err.message
          : "Invalid or expired verification code.";
      setErrors({ form: msg });
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleResend2FA() {
    if (resendCooldown > 0 || isSubmitting) return;
    setErrors({});
    setOtpError(undefined);

    try {
      setIsSubmitting(true);
      await resendLogin2FA(values.email);
      setResendCooldown(60);
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : "Failed to resend code.";
      setErrors({ form: msg });
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
            Philippine Labor Compliance Platform
          </div>

          <h2 className="font-serif text-[32px] lg:text-[36px] font-medium leading-[1.2] text-parchment mb-4">
            Every clause reviewed. Every judgment still yours.
          </h2>
          <p className="text-sm leading-relaxed text-parchment/70">
            Sign in to access your compliance pipeline, review flagged clauses against the Labor Code, and download attorney-verified reports.
          </p>

          {/* Interactive-style glassmorphic Audit Card Preview */}
          <div className="mt-8 rounded-2xl border border-white/10 bg-white/[0.04] p-5 shadow-2xl backdrop-blur-md">
            <div className="flex items-center justify-between pb-3 border-b border-white/10 text-[11px] font-mono text-parchment/60">
              <span>ART. 296 · LABOR CODE</span>
              <span className="rounded-full bg-emerald-500/20 text-emerald-300 px-2.5 py-0.5 text-[10px] font-sans font-semibold">
                Compliant
              </span>
            </div>
            <p className="mt-3 text-xs leading-relaxed text-parchment/90 italic">
              "The employee shall undergo a probationary period of five (5) months from engagement..."
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
                Attorney Gatekeeping
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
        <div className="w-full max-w-[420px] rounded-2xl border border-line bg-white p-8 sm:p-10 shadow-sm">
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

          {step === "credentials" ? (
            <>
              <div className="mb-6">
                <h1 className="font-serif text-2xl font-bold tracking-tight text-navy-deep mb-1.5">
                  Sign in to your account
                </h1>
                <p className="text-xs text-ink-soft leading-relaxed">
                  Enter your credentials to access your contracts and review dashboard.
                </p>
              </div>

          <form noValidate onSubmit={handleSubmit}>
            {errors.form && (
              <div
                role="alert"
                className="mb-4 rounded-xl border border-maroon/30 bg-maroon/5 px-3.5 py-2.5 text-xs text-maroon font-medium"
              >
                {errors.form}
              </div>
            )}

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
            <div className="mb-2">
              <div className="flex items-center justify-between mb-1.5">
                <label
                  htmlFor="password"
                  className="block text-xs font-semibold text-ink-soft"
                >
                  Password
                </label>
                <a
                  href="#forgot-password"
                  onClick={(e) => {
                    e.preventDefault();
                    onNavigateToForgotPassword?.();
                  }}
                  className="text-xs font-semibold text-maroon hover:text-maroon-bright transition-colors"
                >
                  Forgot password?
                </a>
              </div>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  name="password"
                  autoComplete="current-password"
                  placeholder="Enter your password"
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
              {errors.password && (
                <p className="mt-1.5 text-xs text-maroon font-medium">{errors.password}</p>
              )}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="mt-5 w-full rounded-xl bg-maroon py-3 px-4 text-xs font-semibold uppercase tracking-wider text-parchment shadow-xs transition-all hover:bg-maroon-bright active:scale-[0.99] disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
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
                  <span>Authenticating…</span>
                </>
              ) : (
                <span>Continue to verification →</span>
              )}
            </button>
          </form>

          {/* Switch Row */}
          <div className="mt-6 text-center text-xs text-ink-soft">
            Don't have an account?{" "}
            <a
              href="#register"
              onClick={(e) => {
                e.preventDefault();
                onNavigateToRegister?.();
              }}
              className="font-semibold text-maroon hover:text-maroon-bright transition-colors"
            >
              Create an account
            </a>
          </div>

          {/* Trust Note */}
          <div className="mt-6 flex items-start gap-3 rounded-xl border border-line bg-parchment/40 p-3.5">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              className="mt-0.5 h-4 w-4 shrink-0 text-gold"
            >
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            </svg>
            <p className="text-[11px] leading-relaxed text-ink-soft">
              <span className="font-semibold text-ink">Protected under RA 10173.</span>{" "}
              Personal identifying information is redacted prior to analysis. Your contracts are restricted to you and your assigned attorney.
            </p>
          </div>
        </>
      ) : (
        <div>
          <div className="mb-6">
            <span className="font-mono text-[11px] font-semibold text-maroon uppercase tracking-wider block mb-1">
              Step 2 of 2 · Two-Factor Authentication
            </span>
            <h1 className="font-serif text-2xl font-bold tracking-tight text-navy-deep mb-1.5">
              Enter 6-digit code
            </h1>
            <p className="text-xs text-ink-soft leading-relaxed">
              We sent a 2FA verification code to{" "}
              <strong className="text-navy-deep">{values.email}</strong>.
              <button
                type="button"
                onClick={() => {
                  setStep("credentials");
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

          <form noValidate onSubmit={handleVerify2FA}>
            <div className="mb-5">
              <label
                htmlFor="login-otp"
                className="block text-xs font-semibold text-ink-soft mb-1.5"
              >
                6-Digit Verification Code
              </label>
              <input
                id="login-otp"
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
                autoFocus
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
                "Verify & Sign in →"
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
                onClick={handleResend2FA}
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
                setStep("credentials");
                setOtp("");
                setOtpError(undefined);
                setErrors({});
              }}
              className="text-xs font-semibold text-ink-soft hover:text-ink cursor-pointer"
            >
              ← Back to sign-in details
            </button>
          </div>
        </div>
      )}
        </div>
      </div>
    </div>
  );
}

export default LoginPage;
