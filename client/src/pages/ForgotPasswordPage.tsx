import { useState } from "react";
import type { FormEvent } from "react";
import BrandMark from "../components/BrandMark.js";
import TextField from "../components/ui/TextField.js";
import Button from "../components/ui/Button.js";
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
  /** Wired up so the "Log in" link can hand control back to App's view state. */
  onNavigateToLogin?: () => void;
}

/**
 * Password-reset request screen. Deliberately shows the same generic
 * confirmation message whether or not the email is actually registered
 * — this avoids leaking which emails have accounts (account/email
 * enumeration), a standard security practice for reset flows.
 *
 * Frontend-only: submission is mocked with a short delay. The real
 * implementation will POST to services/authService.ts, which should
 * return the same generic success response regardless of whether the
 * email matched an account.
 */
function ForgotPasswordPage({ onNavigateToLogin }: ForgotPasswordPageProps) {
  const [values, setValues] =
    useState<ForgotPasswordFormValues>(INITIAL_VALUES);
  const [errors, setErrors] = useState<ForgotPasswordFormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  function handleChange(event: React.ChangeEvent<HTMLInputElement>) {
    const newValue = event.target.value;
    setValues({ email: newValue });

    // Live-validate as the person types. An empty field stays neutral
    // (no red/green) until they've actually entered something —
    // "required" errors only surface on submit.
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

    // Mock request — the real implementation will POST to
    // services/authService.ts once the backend reset route exists.
    // Note: it should always return this same generic response, whether
    // or not the email is registered.
    window.setTimeout(() => {
      setIsSubmitting(false);
      setSubmitted(true);
    }, 1100);
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-parchment-100 px-4 py-10">
      <div className="w-full max-w-sm rounded-2xl border border-hairline bg-white p-8 shadow-sm shadow-navy-950/5">
        <BrandMark showWordmark={false} />

        <div className="mt-4 text-center">
          <h2 className="font-display text-lg font-semibold text-navy-950">
            Forgot your password?
          </h2>
          <p className="mt-1 text-sm text-ink-600">
            Enter your registered email and we&rsquo;ll send you a reset link.
          </p>
        </div>

        <form
          noValidate
          onSubmit={handleSubmit}
          className="mt-6 flex flex-col gap-5"
        >
          {errors.form && (
            <div
              role="alert"
              className="rounded-lg border border-maroon-600/30 bg-maroon-600/5 px-3.5 py-2.5 text-sm text-maroon-700"
            >
              {errors.form}
            </div>
          )}

          <TextField
            label="Email address"
            type="email"
            name="email"
            autoComplete="email"
            placeholder="juandelacruz@email.com"
            value={values.email}
            onChange={handleChange}
            error={errors.email}
            success={values.email.trim() !== "" && !errors.email}
            maxLength={50}
          />

          <Button type="submit" isLoading={isSubmitting}>
            {isSubmitting ? "Sending…" : "Send reset link"}
          </Button>
        </form>

        {submitted && (
          <div
            role="status"
            className="mt-5 rounded-lg bg-parchment-100 px-3.5 py-3 text-xs leading-relaxed text-ink-600"
          >
            If this email is registered, a reset link will arrive shortly. The
            link expires after 30 minutes — request a new one if it's expired.
          </div>
        )}

        <p className="mt-6 text-center text-sm text-ink-600">
          Remembered your password?{" "}
          <a
            href="#login"
            onClick={(event) => {
              event.preventDefault();
              onNavigateToLogin?.();
            }}
            className="font-medium text-maroon-600 hover:text-maroon-700"
          >
            Log in
          </a>
        </p>
      </div>
    </main>
  );
}

export default ForgotPasswordPage;
