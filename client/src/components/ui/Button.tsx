import type { ButtonHTMLAttributes } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  isLoading?: boolean;
  /** Set false for inline/toolbar buttons (e.g. "Upload contract") instead of full-width form submits. */
  fullWidth?: boolean;
  /** "primary" (default) is the solid navy CTA. "secondary" is the outlined variant, e.g. "Browse files". "danger" is for destructive actions, e.g. "Delete my account". */
  variant?: "primary" | "secondary" | "danger";
}

const VARIANT_CLASSES: Record<NonNullable<ButtonProps["variant"]>, string> = {
  primary:
    "bg-navy-900 text-parchment-100 hover:bg-navy-800 focus-visible:ring-navy-700/50",
  secondary:
    "border border-hairline bg-white text-ink-900 hover:bg-parchment-100 focus-visible:ring-navy-700/30",
  danger:
    "border border-maroon-600 bg-white text-maroon-700 hover:bg-maroon-600/5 focus-visible:ring-maroon-600/30",
};

function Button({
  isLoading = false,
  disabled,
  children,
  className = "",
  fullWidth = true,
  variant = "primary",
  ...buttonProps
}: ButtonProps) {
  return (
    <button
      disabled={disabled || isLoading}
      className={`inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-parchment-100 disabled:cursor-not-allowed disabled:opacity-60 ${VARIANT_CLASSES[variant]} ${fullWidth ? "w-full" : ""} ${className}`}
      {...buttonProps}
    >
      {isLoading && (
        <svg
          className="h-4 w-4 animate-spin text-current"
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
