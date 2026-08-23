import { useState } from "react";
import type { FormEvent } from "react";
import BrandMark from "../components/BrandMark.js";
import { useAuth } from "../context/AuthContext.js";
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
  onNavigateToLogin?: () => void;
  onNavigateToLanding?: () => void;
}

/**
 * Client registration screen matching Lingkod Batas Screen 2 (Register) mockup.
 * Features a split 2-column layout with deep navy brand panel and ghost clause motif.
 */
function RegisterPage({
  onNavigateToLogin,
  onNavigateToLanding,
}: RegisterPageProps) {
  const { register } = useAuth();
  const [values, setValues] = useState<RegisterFormValues>(INITIAL_VALUES);
  const [errors, setErrors] = useState<RegisterFormErrors>({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [accountCreated, setAccountCreated] = useState(false);

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

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const validationErrors = validateRegisterForm(values);
    if (hasValidationErrors(validationErrors)) {
      setErrors(validationErrors);
      return;
    }

    setIsSubmitting(true);
    setErrors({});

    try {
      await register({
        firstName: values.firstName,
        lastName: values.lastName,
        email: values.email,
        password: values.password,
      });
      setAccountCreated(true);
    } catch (err: unknown) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to create account.";
      setErrors({ form: errorMessage });
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
      <div className="relative hidden md:flex flex-col justify-between overflow-hidden bg-navy-deep p-16 text-parchment">
        <div className="relative z-10">
          <BrandMark size="sm" layout="horizontal" theme="dark" />
        </div>

        <div className="relative z-10 max-w-[380px]">
          <h2 className="font-serif text-[30px] font-medium leading-[1.25] text-parchment mb-3.5">
            Upload once. Let an attorney do the reading.
          </h2>
          <p className="text-sm leading-relaxed text-parchment/60">
            Client accounts are free — attorney review still requires sign-off
            before any report reaches you.
          </p>
        </div>

        {/* Ghosted Clause Card (Decorative) */}
        <div
          className="pointer-events-none absolute -right-[60px] -bottom-[40px] w-[340px] rotate-4 rounded-[8px] border border-parchment/10 bg-parchment/[0.04] p-6"
          aria-hidden="true"
        >
          <div className="mb-3 flex justify-between font-mono text-[10px] tracking-[0.04em] text-parchment/30">
            <span>CLAUSE 8.2</span>
            <span>FLAGGED</span>
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
              Create your account
            </h1>
            <p className="text-[13.5px] text-ink-soft">
              For clients seeking contract review.
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

            {/* Name Row */}
            <div className="mb-4.5 grid grid-cols-2 gap-3.5">
              <div>
                <label
                  htmlFor="firstName"
                  className="mb-1.5 block font-mono text-[10.5px] font-medium tracking-[0.05em] text-ink-soft uppercase"
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
                  className="w-full rounded-[6px] border border-line bg-white px-3.5 py-3 text-sm text-ink placeholder:text-[#a39c8e] focus:border-navy focus:outline-none"
                />
                {errors.firstName && (
                  <p className="mt-1.5 text-xs text-maroon">
                    {errors.firstName}
                  </p>
                )}
              </div>
              <div>
                <label
                  htmlFor="lastName"
                  className="mb-1.5 block font-mono text-[10.5px] font-medium tracking-[0.05em] text-ink-soft uppercase"
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
                  className="w-full rounded-[6px] border border-line bg-white px-3.5 py-3 text-sm text-ink placeholder:text-[#a39c8e] focus:border-navy focus:outline-none"
                />
                {errors.lastName && (
                  <p className="mt-1.5 text-xs text-maroon">
                    {errors.lastName}
                  </p>
                )}
              </div>
            </div>

            {/* Email Field */}
            <div className="mb-4.5">
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
                onChange={handleChange("email")}
                className="w-full rounded-[6px] border border-line bg-white px-3.5 py-3 text-sm text-ink placeholder:text-[#a39c8e] focus:border-navy focus:outline-none"
              />
              {errors.email && (
                <p className="mt-1.5 text-xs text-maroon">{errors.email}</p>
              )}
            </div>

            {/* Password Field */}
            <div className="mb-4.5">
              <div className="mb-1.5 flex items-baseline justify-between">
                <label
                  htmlFor="password"
                  className="font-mono text-[10.5px] font-medium tracking-[0.05em] text-ink-soft uppercase"
                >
                  Password
                </label>
                <span className="font-mono text-[10px] text-ink-soft/60">
                  {values.password.length} / 50
                </span>
              </div>
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
                  className="w-full rounded-[6px] border border-line bg-white px-3.5 py-3 pr-10 text-sm text-ink placeholder:text-[#a39c8e] focus:border-navy focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-ink-soft hover:text-ink cursor-pointer"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? (
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.6"
                      className="h-4 w-4"
                    >
                      <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24" />
                      <line x1="1" y1="1" x2="23" y2="23" strokeWidth="1.6" />
                    </svg>
                  ) : (
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.6"
                      className="h-4 w-4"
                    >
                      <path d="M2 12S5 5 12 5S22 12 22 12S19 19 12 19S2 12 2 12Z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                  )}
                </button>
              </div>
              <p className="mt-1.5 text-[11.5px] leading-[1.4] text-ink-soft">
                Must include an uppercase letter, a lowercase letter, and a
                number.
              </p>
              {errors.password && (
                <p className="mt-1 text-xs text-maroon">{errors.password}</p>
              )}
            </div>

            {/* Confirm Password Field */}
            <div className="mb-5">
              <label
                htmlFor="confirmPassword"
                className="mb-1.5 block font-mono text-[10.5px] font-medium tracking-[0.05em] text-ink-soft uppercase"
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
                  className="w-full rounded-[6px] border border-line bg-white px-3.5 py-3 pr-10 text-sm text-ink placeholder:text-[#a39c8e] focus:border-navy focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword((prev) => !prev)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-ink-soft hover:text-ink cursor-pointer"
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
                      strokeWidth="1.6"
                      className="h-4 w-4"
                    >
                      <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24" />
                      <line x1="1" y1="1" x2="23" y2="23" strokeWidth="1.6" />
                    </svg>
                  ) : (
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.6"
                      className="h-4 w-4"
                    >
                      <path d="M2 12S5 5 12 5S22 12 22 12S19 19 12 19S2 12 2 12Z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                  )}
                </button>
              </div>
              {errors.confirmPassword && (
                <p className="mt-1.5 text-xs text-maroon">
                  {errors.confirmPassword}
                </p>
              )}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="mt-2 w-full rounded-[6px] bg-maroon p-3.5 text-[14.5px] font-semibold text-parchment transition-colors hover:bg-maroon-bright disabled:opacity-60 cursor-pointer"
            >
              {isSubmitting ? "Creating account…" : "Create account"}
            </button>
          </form>

          {/* Switch Row */}
          <div className="mt-5.5 text-center text-[13px] text-ink-soft">
            Already have an account?{" "}
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

export default RegisterPage;
