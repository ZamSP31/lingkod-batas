import type { ButtonHTMLAttributes } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  isLoading?: boolean;
  /** Set false for inline/toolbar buttons (e.g. "Upload contract") instead of full-width form submits. */
  fullWidth?: boolean;
  /**
   * "primary" (default) is the maroon action CTA.
   * "secondary" is the parchment/white outlined variant.
   * "danger" is for destructive actions.
   */
  variant?: "primary" | "secondary" | "danger";
}

const VARIANT_CLASSES: Record<NonNullable<ButtonProps["variant"]>, string> = {
  primary:
    "bg-maroon text-parchment hover:bg-maroon-bright focus-visible:ring-maroon/40 active:brightness-95",
  secondary:
    "border border-line bg-white text-ink hover:bg-parchment/60 focus-visible:ring-navy/30",
  danger:
    "border border-maroon bg-white text-maroon hover:bg-maroon/5 focus-visible:ring-maroon/30",
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
      className={`inline-flex items-center justify-center gap-2 rounded-[5px] px-4 py-2.5 text-[13.5px] font-semibold transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-parchment disabled:cursor-not-allowed disabled:opacity-60 cursor-pointer ${VARIANT_CLASSES[variant]} ${
        fullWidth ? "w-full" : ""
      } ${className}`}
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
