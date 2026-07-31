import { useState } from "react";
import type { FormEvent } from "react";
import BrandMark from "../components/BrandMark.js";
import BackToHomeLink from "../components/BackToHomeLink.js";
import TextField from "../components/ui/TextField.js";
import PasswordField from "../components/ui/PasswordField.js";
import Button from "../components/ui/Button.js";
import {
  validateLoginForm,
  validateEmail,
  validateLoginPassword,
  hasValidationErrors,
} from "../utils/validation.js";
import type { LoginFormErrors, LoginFormValues } from "../types/auth.js";

const INITIAL_VALUES: LoginFormValues = { email: "", password: "" };

interface LoginPageProps {
  /** Wired up so the "Register account" link can hand control to App's view state. */
  onNavigateToRegister?: () => void;
  /** Wired up so the "Forgot your password?" link can hand control to App's view state. */
  onNavigateToForgotPassword?: () => void;
  /** Wired up so the "Back to home" link can hand control to App's view state. */
  onNavigateToLanding?: () => void;
}

/**
 * Shared sign-in screen for both roles (Client and Attorney). The backend
 * determines the account's role from the credentials and returns it in
 * the auth response — this form itself stays role-agnostic.
 *
 * Client accounts self-register via the "Register account" link below
 * (see RegisterPage). Attorney accounts are admin-provisioned and never
 * self-register, but still sign in through this same form.
 *
 * This is a frontend-only implementation: submission is mocked with a
 * short delay to demonstrate the loading/disabled state a real API call
 * would produce. Once services/authService.ts exists, handleSubmit will
 * call it, read `response.role`, and redirect to /client/dashboard or
 * /attorney/dashboard accordingly (react-router, once it's added).
 */
function LoginPage({
  onNavigateToRegister,
  onNavigateToForgotPassword,
  onNavigateToLanding,
}: LoginPageProps) {
  const [values, setValues] = useState<LoginFormValues>(INITIAL_VALUES);
  const [errors, setErrors] = useState<LoginFormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [signedIn, setSignedIn] = useState(false);

  function handleChange(field: keyof LoginFormValues) {
    return (event: React.ChangeEvent<HTMLInputElement>) => {
      const newValue = event.target.value;
      setValues((prev) => ({ ...prev, [field]: newValue }));

      // Live-validate as the person types. An empty field stays neutral
      // (no red/green) until they've actually entered something —
      // "required" errors only surface on submit.
      const liveError =
        newValue.trim() === ""
          ? undefined
          : field === "email"
            ? validateEmail(newValue)
            : validateLoginPassword(newValue);

      setErrors((prev) => ({ ...prev, [field]: liveError, form: undefined }));
    };
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const validationErrors = validateLoginForm(values);
    if (hasValidationErrors(validationErrors)) {
      setErrors(validationErrors);
      return;
    }

    setIsSubmitting(true);
    setErrors({});

    // Mock authentication call — the real implementation will POST to
    // services/authService.ts once the backend auth route exists, then
    // redirect based on response.role ("client" | "attorney").
    window.setTimeout(() => {
      setIsSubmitting(false);
      setSignedIn(true);
    }, 1100);
  }

  if (signedIn) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-parchment-100 px-4">
        <div className="w-full max-w-sm">
          <BackToHomeLink onClick={onNavigateToLanding} />
          <div className="rounded-2xl border border-hairline bg-white p-8 text-center shadow-sm">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-navy-900/10">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                className="h-6 w-6 text-navy-900"
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
            <h2 className="font-display text-lg font-semibold text-navy-950">
              Signed in
            </h2>
            <p className="mt-1.5 text-sm text-ink-600">
              This is a frontend-only mock — no dashboard is wired up yet.
            </p>
            <button
              type="button"
              onClick={() => {
                setSignedIn(false);
                setValues(INITIAL_VALUES);
              }}
              className="mt-6 text-sm font-medium text-maroon-600 hover:text-maroon-700"
            >
              Back to sign in
            </button>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-parchment-100 px-4 py-10">
      <div className="w-full max-w-sm">
        <BackToHomeLink onClick={onNavigateToLanding} />
        <div className="rounded-2xl border border-hairline bg-white p-8 shadow-sm shadow-navy-950/5">
          <BrandMark />

          <p className="mt-2 text-center text-sm text-ink-600">
            Sign in to your account
          </p>

          <form
            noValidate
            onSubmit={handleSubmit}
            className="mt-7 flex flex-col gap-5"
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
              placeholder="name@lawfirm.ph"
              value={values.email}
              onChange={handleChange("email")}
              error={errors.email}
              success={values.email.trim() !== "" && !errors.email}
              maxLength={50}
              showCharCount
            />

            <div className="flex flex-col gap-1.5">
              <PasswordField
                label="Password"
                name="password"
                autoComplete="current-password"
                placeholder="Enter your password"
                value={values.password}
                onChange={handleChange("password")}
                error={errors.password}
                success={values.password.trim() !== "" && !errors.password}
                maxLength={50}
                showCharCount
              />
              <div className="flex justify-end">
                <a
                  href="#forgot-password"
                  onClick={(event) => {
                    event.preventDefault();
                    onNavigateToForgotPassword?.();
                  }}
                  className="text-sm font-medium text-maroon-600 hover:text-maroon-700"
                >
                  Forgot your password?
                </a>
              </div>
            </div>

            <Button type="submit" isLoading={isSubmitting} className="mt-1">
              {isSubmitting ? "Signing in…" : "Log in"}
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-ink-600">
            Don&rsquo;t have an account?{" "}
            <a
              href="#register"
              onClick={(event) => {
                event.preventDefault();
                onNavigateToRegister?.();
              }}
              className="font-medium text-maroon-600 hover:text-maroon-700"
            >
              Register account
            </a>
          </p>

          <p className="mt-5 text-center text-xs leading-relaxed text-ink-400">
            Your documents are encrypted and only accessible to your account and
            its assigned reviewing attorney.
          </p>
        </div>
      </div>
    </main>
  );
}

export default LoginPage;
