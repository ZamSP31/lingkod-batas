import { forwardRef, useId, useState } from "react";
import type { InputHTMLAttributes } from "react";

interface PasswordFieldProps extends Omit<
  InputHTMLAttributes<HTMLInputElement>,
  "type"
> {
  label: string;
  error?: string | undefined;
  /** Shows a live "x / max" counter next to the label when maxLength is set. */
  showCharCount?: boolean;
}

const EyeIcon = ({ open }: { open: boolean }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    className="h-4.5 w-4.5"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M2.5 12S5.7 5.5 12 5.5 21.5 12 21.5 12 18.3 18.5 12 18.5 2.5 12 2.5 12z"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <circle cx="12" cy="12" r="2.75" stroke="currentColor" strokeWidth="1.5" />
    {!open && (
      <path
        d="M4 4l16 16"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    )}
  </svg>
);

const PasswordField = forwardRef<HTMLInputElement, PasswordFieldProps>(
  (
    {
      label,
      error,
      id,
      className = "",
      showCharCount = false,
      maxLength,
      value,
      ...inputProps
    },
    ref,
  ) => {
    const [visible, setVisible] = useState(false);
    const generatedId = useId();
    const inputId = id ?? generatedId;
    const errorId = `${inputId}-error`;
    const currentLength = typeof value === "string" ? value.length : 0;
    const nearLimit =
      typeof maxLength === "number" && currentLength >= maxLength * 0.9;

    return (
      <div className="flex flex-col gap-1.5">
        <div className="flex items-baseline justify-between">
          <label htmlFor={inputId} className="text-sm font-medium text-ink-900">
            {label}
          </label>
          {showCharCount && typeof maxLength === "number" && (
            <span
              className={`text-xs tabular-nums ${
                nearLimit ? "text-maroon-600" : "text-ink-400"
              }`}
              aria-hidden="true"
            >
              {currentLength} / {maxLength}
            </span>
          )}
        </div>
        <div className="relative">
          <input
            ref={ref}
            id={inputId}
            type={visible ? "text" : "password"}
            value={value}
            maxLength={maxLength}
            aria-invalid={Boolean(error)}
            aria-describedby={error ? errorId : undefined}
            className={`w-full rounded-lg border bg-parchment-50 px-3.5 py-2.5 pr-11 text-sm text-ink-900 placeholder:text-ink-400 outline-none transition-colors focus:border-navy-700 focus:ring-2 focus:ring-navy-700/20 ${
              error ? "border-maroon-600" : "border-hairline"
            } ${className}`}
            {...inputProps}
          />
          <button
            type="button"
            onClick={() => setVisible((v) => !v)}
            aria-label={visible ? "Hide password" : "Show password"}
            aria-pressed={visible}
            className="absolute inset-y-0 right-0 flex w-10 items-center justify-center text-ink-400 hover:text-ink-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy-700/40 rounded-r-lg"
          >
            <EyeIcon open={visible} />
          </button>
        </div>
        {error && (
          <p id={errorId} className="text-xs text-maroon-600" role="alert">
            {error}
          </p>
        )}
      </div>
    );
  },
);

PasswordField.displayName = "PasswordField";

export default PasswordField;
