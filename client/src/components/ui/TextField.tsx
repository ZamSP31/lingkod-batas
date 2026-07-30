import { forwardRef, useId } from "react";
import type { InputHTMLAttributes } from "react";

interface TextFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string | undefined;
  /** Shows a live "x / max" counter next to the label when maxLength is set. */
  showCharCount?: boolean;
}

const TextField = forwardRef<HTMLInputElement, TextFieldProps>(
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
        <input
          ref={ref}
          id={inputId}
          value={value}
          maxLength={maxLength}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? errorId : undefined}
          className={`w-full rounded-lg border bg-parchment-50 px-3.5 py-2.5 text-sm text-ink-900 placeholder:text-ink-400 outline-none transition-colors focus:border-navy-700 focus:ring-2 focus:ring-navy-700/20 ${
            error ? "border-maroon-600" : "border-hairline"
          } ${className}`}
          {...inputProps}
        />
        {error && (
          <p id={errorId} className="text-xs text-maroon-600" role="alert">
            {error}
          </p>
        )}
      </div>
    );
  },
);

TextField.displayName = "TextField";

export default TextField;
