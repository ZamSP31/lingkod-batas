import type { ButtonHTMLAttributes } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  isLoading?: boolean;
}

function Button({
  isLoading = false,
  disabled,
  children,
  className = "",
  ...buttonProps
}: ButtonProps) {
  return (
    <button
      disabled={disabled || isLoading}
      className={`inline-flex w-full items-center justify-center gap-2 rounded-lg bg-navy-900 px-4 py-2.5 text-sm font-semibold text-parchment-100 transition-colors hover:bg-navy-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy-700/50 focus-visible:ring-offset-2 focus-visible:ring-offset-parchment-100 disabled:cursor-not-allowed disabled:opacity-60 ${className}`}
      {...buttonProps}
    >
      {isLoading && (
        <svg
          className="h-4 w-4 animate-spin text-parchment-100"
          viewBox="0 0 24 24"
          fill="none"
          aria-hidden="true"
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
            className="opacity-90"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
          />
        </svg>
      )}
      {children}
    </button>
  );
}

export default Button;
