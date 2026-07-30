import { useState } from "react";
import type { FormEvent } from "react";
import BrandMark from "../components/BrandMark.js";
import TextField from "../components/ui/TextField.js";
import PasswordField from "../components/ui/PasswordField.js";
import Button from "../components/ui/Button.js";
import {
  validateRegisterForm,
  validateName,
  validateEmail,
  validateNewPassword,
  validateConfirmPassword,
  hasValidationErrors,
} from "../utils/validation.js";
import type { RegisterFormErrors, RegisterFormValues } from "../types/auth.js";

const INITIAL_VALUES: RegisterFormValues = {
  firstName: "",
  lastName: "",
  email: "",
  password: "",
  confirmPassword: "",
};

interface RegisterPageProps {
  /** Wired up so the "Log in" link can hand control back to App's view state. */
  onNavigateToLogin?: () => void;
}

/**
 * Client account-creation screen (self-registration). Per the README,
 * only Clients self-register here — Attorney accounts are always
 * admin-provisioned and never go through this form.
 *
 * Frontend-only: submission is mocked with a short delay, same pattern
 * as LoginPage.
 */
function RegisterPage({ onNavigateToLogin }: RegisterPageProps) {
  const [values, setValues] = useState<RegisterFormValues>(INITIAL_VALUES);
  const [errors, setErrors] = useState<RegisterFormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [accountCreated, setAccountCreated] = useState(false);

  function handleChange(field: keyof RegisterFormValues) {
    return (event: React.ChangeEvent<HTMLInputElement>) => {
      const newValue = event.target.value;
      const nextValues = { ...values, [field]: newValue };
      setValues(nextValues);

      // Live-validate as the person types. An empty field stays neutral
      // (no red/green) until they've actually entered something —
      // "required" errors only surface on submit.
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
        // Changing the password can flip whether confirmPassword now matches.
        ...(field === "password"
          ? { confirmPassword: liveErrorFor("confirmPassword") }
          : {}),
        form: undefined,
      }));
    };
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const validationErrors = validateRegisterForm(values);
    if (hasValidationErrors(validationErrors)) {
      setErrors(validationErrors);
      return;
    }

    setIsSubmitting(true);
    setErrors({});

    // Mock account creation — the real implementation will POST to
    // services/authService.ts once the backend register route exists.
    window.setTimeout(() => {
      setIsSubmitting(false);
      setAccountCreated(true);
    }, 1100);
  }

  if (accountCreated) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-parchment-100 px-4">
        <div className="w-full max-w-sm rounded-2xl border border-hairline bg-white p-8 text-center shadow-sm">
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
            Account created
          </h2>
          <p className="mt-1.5 text-sm text-ink-600">
            This is a frontend-only mock — no account was actually created.
          </p>
          <button
            type="button"
            onClick={() => {
              setAccountCreated(false);
              setValues(INITIAL_VALUES);
              onNavigateToLogin?.();
            }}
            className="mt-6 text-sm font-medium text-maroon-600 hover:text-maroon-700"
          >
            Back to sign in
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-parchment-100 px-4 py-10">
      <div className="w-full max-w-sm rounded-2xl border border-hairline bg-white p-8 shadow-sm shadow-navy-950/5">
        <BrandMark size="md" />

        <div className="mt-4 text-center">
          <h2 className="font-display text-lg font-semibold text-navy-950">
            Create your account
          </h2>
          <p className="mt-1 text-sm text-ink-600">
            For clients seeking contract review
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

          <div className="grid grid-cols-2 gap-4">
            <TextField
              label="First name"
              name="firstName"
              autoComplete="given-name"
              placeholder="Juan"
              value={values.firstName}
              onChange={handleChange("firstName")}
              error={errors.firstName}
              success={values.firstName.trim() !== "" && !errors.firstName}
              maxLength={50}
            />
            <TextField
              label="Last name"
              name="lastName"
              autoComplete="family-name"
              placeholder="Dela Cruz"
              value={values.lastName}
              onChange={handleChange("lastName")}
              error={errors.lastName}
              success={values.lastName.trim() !== "" && !errors.lastName}
              maxLength={50}
            />
          </div>

          <TextField
            label="Email address"
            type="email"
            name="email"
            autoComplete="email"
            placeholder="juandelacruz@email.com"
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
              autoComplete="new-password"
              placeholder="At least 8 characters"
              value={values.password}
              onChange={handleChange("password")}
              error={errors.password}
              success={values.password.trim() !== "" && !errors.password}
              maxLength={50}
              showCharCount
            />
            <p className="text-xs text-ink-400">
              Must include an uppercase letter, a lowercase letter, and a
              number.
            </p>
          </div>

          <PasswordField
            label="Confirm password"
            name="confirmPassword"
            autoComplete="new-password"
            placeholder="Re-enter your password"
            value={values.confirmPassword}
            onChange={handleChange("confirmPassword")}
            error={errors.confirmPassword}
            success={
              values.confirmPassword.trim() !== "" && !errors.confirmPassword
            }
            maxLength={50}
          />

          <Button type="submit" isLoading={isSubmitting} className="mt-1">
            {isSubmitting ? "Creating account…" : "Create account"}
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-ink-600">
          Already have an account?{" "}
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

export default RegisterPage;
