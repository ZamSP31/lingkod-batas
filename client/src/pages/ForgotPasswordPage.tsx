import { useState } from "react";
import type { FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import BrandMark from "../components/BrandMark.js";
import {
  validateForgotPasswordForm,
  validateEmail,
  hasValidationErrors,
} from "../utils/validation.js";
import { requestPasswordReset } from "../services/authService.js";
import type {
  ForgotPasswordFormErrors,
  ForgotPasswordFormValues,
} from "../types/auth.js";

const INITIAL_VALUES: ForgotPasswordFormValues = { email: "" };

interface ForgotPasswordPageProps {
  onNavigateToLogin?: () => void;
  onNavigateToLanding?: () => void;
  onNavigateToReset?: (token: string) => void;
}

/**
 * Modern password-reset request screen styled to industry standards.
 * Features a split 2-column layout with deep navy brand panel and secure token card.
 */
function ForgotPasswordPage({
  onNavigateToLogin,
  onNavigateToLanding,
  onNavigateToReset,
}: ForgotPasswordPageProps) {
  const navigate = useNavigate();
  const [values, setValues] =
    useState<ForgotPasswordFormValues>(INITIAL_VALUES);
  const [errors, setErrors] = useState<ForgotPasswordFormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [resetToken, setResetToken] = useState<string | null>(null);

  function handleChange(event: React.ChangeEvent<HTMLInputElement>) {
    const newValue = event.target.value;
    setValues({ email: newValue });

    const liveError =
      newValue.trim() === "" ? undefined : validateEmail(newValue);
    setErrors((prev) => ({ ...prev, email: liveError, form: undefined }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const validationErrors = validateForgotPasswordForm(values);
    if (hasValidationErrors(validationErrors)) {
      setErrors(validationErrors);
      return;
    }

    try {
      setIsSubmitting(true);
      setErrors({});
      const res = await requestPasswordReset(values.email);
      setSubmitted(true);
      if (res.resetToken) {
        setResetToken(res.resetToken);
      }
    } catch (err: unknown) {
      const msg =
        err instanceof Error
          ? err.message
          : "Failed to dispatch password recovery link.";
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
            Secure recovery for your verified access.
          </h2>
          <p className="text-sm leading-relaxed text-parchment/70">
            Enter your registered email address and we&rsquo;ll dispatch a cryptographic, time-limited password reset link to restore your dashboard access.
          </p>

          {/* Interactive-style glassmorphic Security Card Preview */}
          <div className="mt-8 rounded-2xl border border-white/10 bg-white/[0.04] p-5 shadow-2xl backdrop-blur-md">
            <div className="flex items-center justify-between pb-3 border-b border-white/10 text-[11px] font-mono text-parchment/60">
              <span>ACCOUNT RECOVERY · RA 10173</span>
              <span className="rounded-full bg-emerald-500/20 text-emerald-300 px-2.5 py-0.5 text-[10px] font-sans font-semibold">
                Encrypted
              </span>
            </div>
            <p className="mt-3 text-xs text-parchment/80 leading-relaxed font-sans">
              &ldquo;One-time recovery tokens are hashed, salted, and set to auto-expire after 30 minutes. Account access remains gated behind strict verification protocols.&rdquo;
            </p>
            <div className="mt-4 flex items-center justify-between pt-3 border-t border-white/10 text-[11px] text-parchment/50">
              <span className="flex items-center gap-1.5">
                <svg className="w-3.5 h-3.5 text-gold" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                Zero Credential Leakage
              </span>
              <span className="text-[10px] font-mono text-emerald-400">STATUS: ACTIVE</span>
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

          <div className="mb-6">
            <h1 className="font-serif text-2xl font-bold tracking-tight text-navy-deep mb-1.5">
              Reset your password
            </h1>
            <p className="text-xs text-ink-soft leading-relaxed">
              Enter your registered email and we&rsquo;ll send you an encrypted recovery link.
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
            <div className="mb-5">
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
                onChange={handleChange}
                className="w-full rounded-xl border border-line bg-white px-3.5 py-2.5 text-sm text-ink placeholder:text-ink-soft/40 focus:border-navy-deep focus:outline-none focus:ring-2 focus:ring-navy-deep/10 transition-all shadow-2xs"
              />
              {errors.email && (
                <p className="mt-1.5 text-xs text-maroon font-medium">{errors.email}</p>
              )}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full rounded-xl bg-maroon py-3 px-4 text-xs font-semibold uppercase tracking-wider text-parchment shadow-xs hover:bg-maroon-bright active:scale-[0.99] transition-all disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-parchment" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Sending recovery link…
                </>
              ) : (
                "Send reset link"
              )}
            </button>
          </form>

          {submitted && (
            <div
              role="status"
              className="mt-5 rounded-xl border border-line bg-parchment/60 p-4 text-xs text-ink shadow-2xs"
            >
              <div className="flex items-center gap-2 font-semibold text-emerald-800 mb-1">
                <svg className="w-4 h-4 text-emerald-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Recovery link dispatched
              </div>
              <p className="text-ink-soft leading-relaxed text-[11.5px]">
                If this email is associated with an active account, you will receive an encrypted reset link shortly. The link expires in 30 minutes.
              </p>

              {resetToken && (
                <div className="mt-3.5 pt-3 border-t border-line/60">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="font-mono text-[10px] uppercase font-bold tracking-wider text-navy-deep">
                      Development Test Link
                    </span>
                    <span className="text-[10px] rounded-full bg-emerald-100 text-emerald-800 font-semibold px-2 py-0.5">
                      Ready
                    </span>
                  </div>
                  <p className="text-[11px] text-ink-soft mb-2.5">
                    Since this is a local development environment, you can directly proceed with your reset token below:
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      if (onNavigateToReset) {
                        onNavigateToReset(resetToken);
                      } else {
                        navigate(`/reset-password?token=${resetToken}`);
                      }
                    }}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-navy-deep px-3 py-1.5 text-xs font-semibold text-parchment hover:bg-navy transition-colors cursor-pointer"
                  >
                    <span>Proceed to Reset Password</span>
                    <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M5 12h14M12 5l7 7-7 7" />
                    </svg>
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Switch Row */}
          <div className="mt-6 text-center text-xs text-ink-soft">
            Remembered your password?{" "}
            <a
              href="#login"
              onClick={(e) => {
                e.preventDefault();
                onNavigateToLogin?.();
              }}
              className="font-semibold text-maroon hover:text-maroon-bright transition-colors"
            >
              Log in
            </a>
          </div>

          {/* Privacy Note */}
          <div className="mt-8 pt-6 border-t border-line flex items-center justify-center gap-2 text-[11px] text-ink-soft/60">
            <svg className="w-3.5 h-3.5 text-gold shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
            <span>Compliant with Data Privacy Act of 2012 (RA 10173)</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ForgotPasswordPage;
