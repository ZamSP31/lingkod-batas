import { forwardRef } from "react";
import type { InputHTMLAttributes } from "react";

interface CheckboxProps extends InputHTMLAttributes<HTMLInputElement> {
  /** Visually-hidden label — always required for a11y even when the row itself provides visible context. */
  label: string;
}

/**
 * A themed checkbox with maroon accent used for row selection in tables.
 */
const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(
  ({ label, className = "", ...inputProps }, ref) => {
    return (
      <label className="inline-flex cursor-pointer items-center">
        <input
          ref={ref}
          type="checkbox"
          className={`h-4 w-4 cursor-pointer rounded-[3px] border-[1.5px] border-line accent-maroon outline-none focus-visible:ring-2 focus-visible:ring-maroon/30 ${className}`}
          {...inputProps}
        />
        <span className="sr-only">{label}</span>
      </label>
    );
  },
);

Checkbox.displayName = "Checkbox";

export default Checkbox;
