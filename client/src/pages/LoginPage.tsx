import { useState } from "react";
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
 */
function LoginPage({
  onNavigateToRegister,
  onNavigateToForgotPassword,
  onNavigateToLanding,
}: LoginPageProps) {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [values, setValues] = useState<LoginFormValues>(INITIAL_VALUES);
  const [errors, setErrors] = useState<LoginFormErrors>({});
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

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
      const user = await login({
        email: values.email,
        password: values.password,
      });

      // Role-based redirection
      if (user.role === "attorney") {
        navigate("/attorney");
      } else {
        navigate("/client");
      }
    } catch (err: unknown) {
      const errorMessage =
        err instanceof Error ? err.message : "Invalid email or password.";
      setErrors({ form: errorMessage });
    } finally {
      setIsSubmitting(false);
    }
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
            Every clause reviewed. Every judgment still yours.
          </h2>
          <p className="text-sm leading-relaxed text-parchment/60">
            Sign in to pick up where your review queue left off.
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
              Sign in to your account
            </h1>
            <p className="text-[13.5px] text-ink-soft">
              Enter your credentials to access your dashboard.
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
            <div className="mb-2">
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
                  autoComplete="current-password"
                  placeholder="Enter your password"
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
              {errors.password && (
                <p className="mt-1.5 text-xs text-maroon">{errors.password}</p>
              )}
            </div>

            {/* Forgot Password Link */}
            <div className="mb-5 text-right">
              <a
                href="#forgot-password"
                onClick={(e) => {
                  e.preventDefault();
                  onNavigateToForgotPassword?.();
                }}
                className="text-[12.5px] font-semibold text-maroon hover:text-maroon-bright"
              >
                Forgot your password?
              </a>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full rounded-[6px] bg-maroon p-3.5 text-[14.5px] font-semibold text-parchment transition-colors hover:bg-maroon-bright disabled:opacity-60 cursor-pointer"
            >
              {isSubmitting ? "Signing in…" : "Log in"}
            </button>
          </form>

          {/* Switch Row */}
          <div className="mt-5.5 text-center text-[13px] text-ink-soft">
            Don't have an account?{" "}
            <a
              href="#register"
              onClick={(e) => {
                e.preventDefault();
                onNavigateToRegister?.();
              }}
              className="font-semibold text-maroon hover:text-maroon-bright"
            >
              Register account
            </a>
          </div>

          {/* Trust Note */}
          <div className="mt-6.5 flex gap-2.5 rounded-[6px] bg-navy/[0.04] p-3.5">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.6"
              className="mt-0.5 h-3.5 w-3.5 shrink-0 text-gold"
            >
              <path d="M12 2L4 6V12C4 17 7.5 21 12 22C16.5 21 20 17 20 12V6L12 2Z" />
            </svg>
            <p className="text-[11.5px] leading-[1.55] text-ink-soft">
              <b className="font-semibold text-ink">Encrypted end to end.</b>{" "}
              Your documents are only accessible to your account and its
              assigned reviewing attorney.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default LoginPage;
