import { useState } from "react";
import type { FormEvent } from "react";
import BrandMark from "../components/BrandMark.js";
import {
  validateForgotPasswordForm,
  validateEmail,
  hasValidationErrors,
} from "../utils/validation.js";
import type {
  ForgotPasswordFormErrors,
  ForgotPasswordFormValues,
} from "../types/auth.js";

const INITIAL_VALUES: ForgotPasswordFormValues = { email: "" };

interface ForgotPasswordPageProps {
  onNavigateToLogin?: () => void;
  onNavigateToLanding?: () => void;
}

/**
 * Password-reset request screen styled with the Lingkod Batas split 2-column layout.
 */
function ForgotPasswordPage({
  onNavigateToLogin,
  onNavigateToLanding,
}: ForgotPasswordPageProps) {
  const [values, setValues] =
    useState<ForgotPasswordFormValues>(INITIAL_VALUES);
  const [errors, setErrors] = useState<ForgotPasswordFormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  function handleChange(event: React.ChangeEvent<HTMLInputElement>) {
    const newValue = event.target.value;
    setValues({ email: newValue });

    const liveError =
      newValue.trim() === "" ? undefined : validateEmail(newValue);
    setErrors((prev) => ({ ...prev, email: liveError, form: undefined }));
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const validationErrors = validateForgotPasswordForm(values);
    if (hasValidationErrors(validationErrors)) {
      setErrors(validationErrors);
      return;
    }

    setIsSubmitting(true);
    setErrors({});

    window.setTimeout(() => {
      setIsSubmitting(false);
      setSubmitted(true);
    }, 900);
  }

  return (
    <div className="grid min-h-screen grid-cols-1 md:grid-cols-2 bg-parchment">
      {/* LEFT: Brand Panel */}
      <div className="relative hidden md:flex flex-col justify-between overflow-hidden bg-navy-deep p-16 text-parchment">
        <div className="relative z-10">
          <BrandMark size="sm" layout="horizontal" theme="dark" />
        </div>

        <div className="relative z-10 max-w-[380px]">
          <h2 className="font-serif text-[30px] font-medium leading-[1.25] text-parchment mb-3.5">
            Reset access to your account.
          </h2>
          <p className="text-sm leading-relaxed text-parchment/60">
            We will send you a secure link to update your credentials and return to your dashboard.
          </p>
        </div>

        {/* Ghosted Clause Card (Decorative) */}
        <div
          className="pointer-events-none absolute -right-[60px] -bottom-[40px] w-[340px] rotate-4 rounded-[8px] border border-parchment/10 bg-parchment/[0.04] p-6"
          aria-hidden="true"
        >
          <div className="mb-3 flex justify-between font-mono text-[10px] tracking-[0.04em] text-parchment/30">
            <span>SECURITY</span>
            <span>ENCRYPTED</span>
          </div>
          <div className="mb-2 h-2 rounded-[2px] bg-parchment/[0.07]" />
          <div className="mb-2 h-2 w-[40%] rounded-[2px] bg-gold/20" />
          <div className="h-2 w-[60%] rounded-[2px] bg-parchment/[0.07]" />
        </div>
      </div>

      {/* RIGHT: Form Side */}
      <div className="flex items-center justify-center p-8 sm:p-12">
        <div className="w-full max-w-[400px]">
          <a
            href="/"
            onClick={(e) => {
              e.preventDefault();
              onNavigateToLanding?.();
            }}
            className="mb-8 inline-flex items-center gap-1.5 text-[13px] font-medium text-ink-soft hover:text-ink transition-colors"
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              className="h-3.5 w-3.5"
            >
              <path d="M15 18L9 12L15 6" />
            </svg>
            Back to home
          </a>

          <div className="mb-7">
            <h1 className="font-serif text-2xl font-medium tracking-[-0.01em] text-navy-deep mb-1.5">
              Forgot your password?
            </h1>
            <p className="text-[13.5px] text-ink-soft">
              Enter your registered email and we&rsquo;ll send you a reset link.
            </p>
          </div>

          <form noValidate onSubmit={handleSubmit}>
            {errors.form && (
              <div
                role="alert"
                className="mb-4 rounded-[6px] border border-maroon/30 bg-maroon/5 px-3.5 py-2.5 text-sm text-maroon"
              >
                {errors.form}
              </div>
            )}

            {/* Email Field */}
            <div className="mb-5">
              <div className="mb-1.5 flex items-baseline justify-between">
                <label
                  htmlFor="email"
                  className="font-mono text-[10.5px] font-medium tracking-[0.05em] text-ink-soft uppercase"
                >
                  Email address
                </label>
                <span className="font-mono text-[10px] text-ink-soft/60">
                  {values.email.length} / 50
                </span>
              </div>
              <input
                id="email"
                type="email"
                name="email"
                autoComplete="email"
                placeholder="juandelacruz@email.com"
                maxLength={50}
                value={values.email}
                onChange={handleChange}
                className="w-full rounded-[6px] border border-line bg-white px-3.5 py-3 text-sm text-ink placeholder:text-[#a39c8e] focus:border-navy focus:outline-none"
              />
              {errors.email && (
                <p className="mt-1.5 text-xs text-maroon">{errors.email}</p>
              )}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full rounded-[6px] bg-maroon p-3.5 text-[14.5px] font-semibold text-parchment transition-colors hover:bg-maroon-bright disabled:opacity-60 cursor-pointer"
            >
              {isSubmitting ? "Sending…" : "Send reset link"}
            </button>
          </form>

          {submitted && (
            <div
              role="status"
              className="mt-5 rounded-[6px] border border-line bg-parchment-dark/30 p-3.5 text-xs leading-relaxed text-ink-soft"
            >
              If this email is registered, a reset link will arrive shortly. The
              link expires after 30 minutes.
            </div>
          )}

          {/* Switch Row */}
          <div className="mt-5.5 text-center text-[13px] text-ink-soft">
            Remembered your password?{" "}
            <a
              href="#login"
              onClick={(e) => {
                e.preventDefault();
                onNavigateToLogin?.();
              }}
              className="font-semibold text-maroon hover:text-maroon-bright"
            >
              Log in
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ForgotPasswordPage;
